create or replace function public.is_creator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.creator_roles
    where user_id = (select auth.uid())
  );
$function$;

create or replace function public.get_app_user_id()
returns integer
language sql
stable
security definer
set search_path = ''
as $function$
  select id
  from public.users
  where auth_user_id = (select auth.uid())::text
  limit 1;
$function$;

create or replace function public.sync_auth_user_to_app_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  account_email text := lower(btrim(new.email));
  account_name text := nullif(btrim(new.raw_user_meta_data ->> 'name'), '');
begin
  if account_email is null then
    return new;
  end if;

  insert into public.users (auth_user_id, email, name, password_hash)
  values (
    new.id::text,
    account_email,
    coalesce(account_name, split_part(account_email, '@', 1)),
    null
  )
  on conflict do update
    set auth_user_id = coalesce(public.users.auth_user_id, excluded.auth_user_id),
        email = excluded.email,
        name = coalesce(account_name, public.users.name),
        password_hash = null,
        updated_at = now()
    where public.users.auth_user_id is null
       or public.users.auth_user_id = excluded.auth_user_id;

  return new;
end
$function$;

drop trigger if exists auth_user_sync_app_user on auth.users;
create trigger auth_user_sync_app_user
  after insert or update of email, raw_user_meta_data on auth.users
  for each row
  execute function public.sync_auth_user_to_app_user();

create or replace function public.set_like_state(
  target_kind text,
  target_key integer,
  liked boolean default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  account_id integer := public.get_app_user_id();
  total_likes integer;
  user_liked boolean;
begin
  if auth.uid() is null and liked is not null then
    raise exception 'Authentication is required to change likes.' using errcode = '42501';
  end if;
  if auth.uid() is not null and account_id is null then
    raise exception 'An application account is required.' using errcode = '42501';
  end if;

  if target_kind not in ('content', 'post') or target_key < 1 then
    raise exception 'Invalid like target.' using errcode = '22023';
  end if;

  if target_kind = 'content' and not exists (
    select 1 from public.content where id = target_key
  ) then
    raise exception 'Target not found.' using errcode = 'P0002';
  elsif target_kind = 'post' and not exists (
    select 1 from public.posts where id = target_key
  ) then
    raise exception 'Target not found.' using errcode = 'P0002';
  end if;

  if liked is true then
    insert into public.likes (user_id, target_type, target_id)
    values (account_id, target_kind, target_key)
    on conflict (user_id, target_type, target_id) do nothing;
  elsif liked is false then
    delete from public.likes
    where user_id = account_id
      and target_type = target_kind
      and target_id = target_key;
  end if;

  if target_kind = 'content' then
    select like_count into total_likes
    from public.content where id = target_key;
  else
    select count(*)::integer into total_likes
    from public.likes
    where target_type = target_kind and target_id = target_key;
  end if;

  if account_id is not null then
    select exists (
      select 1 from public.likes
      where user_id = account_id
        and target_type = target_kind
        and target_id = target_key
    ) into user_liked;
  else
    user_liked := false;
  end if;

  return jsonb_build_object('count', coalesce(total_likes, 0), 'isLiked', user_liked);
end
$function$;

create or replace function public.sync_content_comment_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if tg_op = 'INSERT' then
    update public.content set comment_count = comment_count + 1 where id = new.content_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.content set comment_count = greatest(comment_count - 1, 0) where id = old.content_id;
    return old;
  end if;
  return new;
end
$function$;

drop trigger if exists content_comments_sync_count on public.content_comments;
create trigger content_comments_sync_count
  after insert or delete on public.content_comments
  for each row
  execute function public.sync_content_comment_count();

create or replace function public.sync_content_like_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  affected_content_id integer;
begin
  if tg_op = 'DELETE' then
    if old.target_type = 'content' then affected_content_id := old.target_id; end if;
  else
    if new.target_type = 'content' then affected_content_id := new.target_id; end if;
  end if;

  if affected_content_id is not null then
    update public.content
    set like_count = (
      select count(*)::integer from public.likes
      where target_type = 'content' and target_id = affected_content_id
    )
    where id = affected_content_id;
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end
$function$;

drop trigger if exists likes_sync_content_count on public.likes;
create trigger likes_sync_content_count
  after insert or delete on public.likes
  for each row
  execute function public.sync_content_like_count();

alter table public.users enable row level security;
alter table public.profile enable row level security;
alter table public.categories enable row level security;
alter table public.content enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.content_comments enable row level security;
alter table public.likes enable row level security;
alter table public.purchases enable row level security;
alter table public.subscriptions enable row level security;
alter table public.inquiries enable row level security;
alter table public.sessions enable row level security;

create policy "Account owners can read their app identity"
  on public.users for select to authenticated
  using (auth_user_id = (select auth.uid())::text);

create policy "Profile is publicly readable"
  on public.profile for select to anon, authenticated using (true);
create policy "Creator can update profile"
  on public.profile for update to authenticated
  using ((select public.is_creator()))
  with check ((select public.is_creator()));

create policy "Categories are publicly readable"
  on public.categories for select to anon, authenticated using (true);
create policy "Creator can manage categories"
  on public.categories for all to authenticated
  using ((select public.is_creator()))
  with check ((select public.is_creator()));

create policy "Content is publicly readable"
  on public.content for select to anon, authenticated using (true);
create policy "Creator can manage content"
  on public.content for all to authenticated
  using ((select public.is_creator()))
  with check ((select public.is_creator()));

create policy "Posts are publicly readable"
  on public.posts for select to anon, authenticated using (true);
create policy "Creator can manage posts"
  on public.posts for all to authenticated
  using ((select public.is_creator()))
  with check ((select public.is_creator()));

create policy "Comments are publicly readable"
  on public.comments for select to anon, authenticated using (true);
create policy "Visitors can add post comments"
  on public.comments for insert to anon, authenticated with check (true);

create policy "Content comments are publicly readable"
  on public.content_comments for select to anon, authenticated using (true);
create policy "Visitors can add content comments"
  on public.content_comments for insert to anon, authenticated with check (true);

create policy "Account owners and creator can read purchases"
  on public.purchases for select to authenticated
  using (
    user_id = (select public.get_app_user_id())
    or (select public.is_creator())
  );

create policy "Account owners can read subscriptions"
  on public.subscriptions for select to authenticated
  using (user_id = (select public.get_app_user_id()));

create policy "Visitors can submit inquiries"
  on public.inquiries for insert to anon, authenticated with check (true);
create policy "Creator can read inquiries"
  on public.inquiries for select to authenticated
  using ((select public.is_creator()));
create policy "Creator can update inquiries"
  on public.inquiries for update to authenticated
  using ((select public.is_creator()))
  with check ((select public.is_creator()));

revoke all on public.users, public.profile, public.categories, public.content,
  public.posts, public.comments, public.content_comments, public.likes,
  public.purchases, public.subscriptions, public.inquiries, public.sessions
  from anon, authenticated;

grant select (id, auth_user_id, email, name, created_at, updated_at) on public.users to authenticated;
grant select on public.profile, public.categories, public.content, public.posts,
  public.comments, public.content_comments to anon, authenticated;
grant update (display_name, username, bio, avatar_url, cover_url, location)
  on public.profile to authenticated;
grant insert, update, delete on public.categories, public.content, public.posts to authenticated;
grant insert (post_id, author_name, body) on public.comments to anon, authenticated;
grant insert (content_id, author_name, body) on public.content_comments to anon, authenticated;
grant select on public.purchases, public.subscriptions to authenticated;
grant insert (name, email, whatsapp, message) on public.inquiries to anon, authenticated;
grant select on public.inquiries to authenticated;
grant update (is_read, reply_message, replied_at) on public.inquiries to authenticated;
grant select on public.likes to authenticated;
grant all on public.profile, public.categories, public.content, public.posts,
  public.purchases, public.subscriptions, public.inquiries, public.likes to service_role;

grant execute on function public.is_creator() to authenticated;
grant execute on function public.get_app_user_id() to authenticated;
grant execute on function public.set_like_state(text, integer, boolean) to authenticated;
grant execute on function public.set_like_state(text, integer, boolean) to anon;
revoke all on function public.sync_auth_user_to_app_user() from public, anon, authenticated;
revoke all on function public.sync_content_comment_count() from public, anon, authenticated;
revoke all on function public.sync_content_like_count() from public, anon, authenticated;
