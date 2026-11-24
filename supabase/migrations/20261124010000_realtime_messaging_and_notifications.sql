create table if not exists public.creator_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create unique index if not exists creator_roles_single_creator_idx
  on public.creator_roles ((true));

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  fan_user_id uuid not null references auth.users (id) on delete cascade,
  creator_user_id uuid not null references public.creator_roles (user_id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversations_distinct_participants check (fan_user_id <> creator_user_id),
  constraint conversations_fan_creator_unique unique (fan_user_id, creator_user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 5000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_created_at_idx
  on public.messages (conversation_id, created_at desc);

create or replace function public.touch_conversation_on_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  fan_id uuid;
  creator_id uuid;
begin
  select fan_user_id, creator_user_id
    into fan_id, creator_id
    from public.conversations
    where id = new.conversation_id;

  update public.conversations
    set updated_at = now()
    where id = new.conversation_id;

  insert into public.notifications (user_id, type, title, body, resource_id)
  values (
    case when new.sender_id = fan_id then creator_id else fan_id end,
    'message',
    'New private message',
    left(new.body, 180),
    new.conversation_id::text
  );

  return new;
end
$function$;

drop trigger if exists messages_touch_conversation on public.messages;
create trigger messages_touch_conversation
  after insert on public.messages
  for each row
  execute function public.touch_conversation_on_message();

revoke all on function public.touch_conversation_on_message() from public, anon, authenticated;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (
    type in (
      'content',
      'post',
      'comment',
      'like',
      'inquiry',
      'purchase',
      'subscription',
      'message',
      'system'
    )
  ),
  title text not null,
  body text not null default '',
  resource_id text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_at_idx
  on public.notifications (user_id, created_at desc);

create table if not exists public.feed_events (
  id uuid primary key default gen_random_uuid(),
  resource_type text not null check (
    resource_type in ('content', 'post', 'comment', 'like')
  ),
  resource_id text not null,
  created_at timestamptz not null default now()
);

alter table public.feed_events enable row level security;

create policy "Feed events are public"
  on public.feed_events
  for select
  to anon, authenticated
  using (true);

revoke all on public.feed_events from anon, authenticated;
grant select on public.feed_events to anon, authenticated;
grant all on public.feed_events to service_role;

create or replace function public.record_feed_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  resource_id text;
  resource_type text;
begin
  resource_type := case tg_table_name
    when 'posts' then 'post'
    else 'content'
  end;

  if tg_op = 'DELETE' then
    resource_id := old.id::text;
  else
    resource_id := new.id::text;
  end if;

  insert into public.feed_events (resource_type, resource_id)
  values (resource_type, resource_id);

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end
$function$;

create trigger content_record_feed_event
  after insert or update or delete on public.content
  for each row
  execute function public.record_feed_event();

create trigger posts_record_feed_event
  after insert or update or delete on public.posts
  for each row
  execute function public.record_feed_event();

revoke all on function public.record_feed_event() from public, anon, authenticated;

create or replace function public.record_engagement_feed_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  resource_type text;
  resource_id text;
begin
  if tg_table_name = 'content_comments' then
    resource_type := 'comment';
    if tg_op = 'DELETE' then
      resource_id := old.content_id::text;
    else
      resource_id := new.content_id::text;
    end if;
  else
    resource_type := 'like';
    if tg_op = 'DELETE' then
      resource_id := old.target_type || ':' || old.target_id::text;
    else
      resource_id := new.target_type || ':' || new.target_id::text;
    end if;
  end if;

  insert into public.feed_events (resource_type, resource_id)
  values (resource_type, resource_id);

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end
$function$;

create trigger content_comments_record_feed_event
  after insert or update or delete on public.content_comments
  for each row
  execute function public.record_engagement_feed_event();

create trigger likes_record_feed_event
  after insert or update or delete on public.likes
  for each row
  execute function public.record_engagement_feed_event();

revoke all on function public.record_engagement_feed_event() from public, anon, authenticated;

create or replace function public.notify_new_content()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  insert into public.notifications (user_id, type, title, body, resource_id)
  select
    auth_user.id,
    'content',
    'New ' || new.type,
    new.title,
    'content:' || new.id::text
  from auth.users as auth_user
  where auth_user.email_confirmed_at is not null
    and not exists (
      select 1
      from public.creator_roles
      where creator_roles.user_id = auth_user.id
    );

  return new;
end
$function$;

drop trigger if exists content_notify_new_item on public.content;
create trigger content_notify_new_item
  after insert on public.content
  for each row
  execute function public.notify_new_content();

revoke all on function public.notify_new_content() from public, anon, authenticated;

create or replace function public.notify_new_post()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  insert into public.notifications (user_id, type, title, body, resource_id)
  select
    auth_user.id,
    'post',
    'New post',
    coalesce(nullif(btrim(new.title), ''), left(new.body, 180)),
    'post:' || new.id::text
  from auth.users as auth_user
  where auth_user.email_confirmed_at is not null
    and not exists (
      select 1
      from public.creator_roles
      where creator_roles.user_id = auth_user.id
    );

  return new;
end
$function$;

drop trigger if exists posts_notify_new_item on public.posts;
create trigger posts_notify_new_item
  after insert on public.posts
  for each row
  execute function public.notify_new_post();

revoke all on function public.notify_new_post() from public, anon, authenticated;

create or replace function public.start_creator_conversation()
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  fan_id uuid := auth.uid();
  creator_id uuid;
  conversation_id uuid;
begin
  if fan_id is null then
    raise exception 'Authentication is required to start a conversation.'
      using errcode = '42501';
  end if;

  select user_id
    into creator_id
    from public.creator_roles
    limit 1;

  if creator_id is null then
    raise exception 'Creator messaging is not configured.'
      using errcode = 'P0002';
  end if;

  if creator_id = fan_id then
    raise exception 'The creator cannot start a fan conversation.'
      using errcode = '42501';
  end if;

  insert into public.conversations (fan_user_id, creator_user_id)
  values (fan_id, creator_id)
  on conflict (fan_user_id, creator_user_id)
  do update set updated_at = now()
  returning id into conversation_id;

  return conversation_id;
end
$function$;

alter table public.creator_roles enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;

create policy "Users can read their own creator role"
  on public.creator_roles
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Participants can read their conversations"
  on public.conversations
  for select
  to authenticated
  using (
    fan_user_id = (select auth.uid())
    or creator_user_id = (select auth.uid())
  );

create policy "Fans can start conversations with a creator"
  on public.conversations
  for insert
  to authenticated
  with check (
    fan_user_id = (select auth.uid())
    and creator_user_id <> (select auth.uid())
  );

create policy "Participants can read conversation messages"
  on public.messages
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.conversations
      where conversations.id = messages.conversation_id
        and (
          conversations.fan_user_id = (select auth.uid())
          or conversations.creator_user_id = (select auth.uid())
        )
    )
  );

create policy "Participants can send messages"
  on public.messages
  for insert
  to authenticated
  with check (
    sender_id = (select auth.uid())
    and exists (
      select 1
      from public.conversations
      where conversations.id = messages.conversation_id
        and (
          conversations.fan_user_id = (select auth.uid())
          or conversations.creator_user_id = (select auth.uid())
        )
    )
  );

create policy "Recipients can mark messages as read"
  on public.messages
  for update
  to authenticated
  using (
    sender_id <> (select auth.uid())
    and exists (
      select 1
      from public.conversations
      where conversations.id = messages.conversation_id
        and (
          conversations.fan_user_id = (select auth.uid())
          or conversations.creator_user_id = (select auth.uid())
        )
    )
  )
  with check (
    read_at is not null
    and sender_id <> (select auth.uid())
    and exists (
      select 1
      from public.conversations
      where conversations.id = messages.conversation_id
        and (
          conversations.fan_user_id = (select auth.uid())
          or conversations.creator_user_id = (select auth.uid())
        )
    )
  );

create policy "Users can read their notifications"
  on public.notifications
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can mark their notifications as read"
  on public.notifications
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and read_at is not null
  );

revoke all on public.creator_roles from anon, authenticated;
grant select on public.creator_roles to authenticated;
grant all on public.creator_roles to service_role;

revoke all on public.conversations from anon, authenticated;
grant select on public.conversations to authenticated;
grant insert (fan_user_id, creator_user_id) on public.conversations to authenticated;
grant all on public.conversations to service_role;

revoke all on public.messages from anon, authenticated;
grant select on public.messages to authenticated;
grant insert (conversation_id, sender_id, body) on public.messages to authenticated;
grant update (read_at) on public.messages to authenticated;
grant all on public.messages to service_role;

revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;
grant all on public.notifications to service_role;

revoke all on function public.start_creator_conversation() from public, anon;
grant execute on function public.start_creator_conversation() to authenticated;

do $$
declare
  table_name text;
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
      and not puballtables
  ) then
    foreach table_name in array array['feed_events', 'conversations', 'messages', 'notifications']
    loop
      if not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = table_name
      ) then
        execute format('alter publication supabase_realtime add table public.%I', table_name);
      end if;
    end loop;
  end if;
end
$$;
