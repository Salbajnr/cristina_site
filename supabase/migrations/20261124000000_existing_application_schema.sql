create table if not exists public.profile (
  id serial primary key,
  display_name text not null,
  username text not null unique,
  bio text not null default '',
  avatar_url text,
  cover_url text,
  location text,
  subscriber_count integer not null default 0,
  total_photos integer not null default 0,
  total_videos integer not null default 0,
  joined_date timestamp not null default now()
);

create table if not exists public.categories (
  id serial primary key,
  name text not null,
  slug text not null unique,
  item_count integer not null default 0
);

create table if not exists public.content (
  id serial primary key,
  title text not null,
  description text,
  type text not null default 'photo',
  price numeric(10, 2) not null default 0,
  preview_url text not null,
  is_locked boolean not null default true,
  is_featured boolean not null default false,
  category_id integer,
  like_count integer not null default 0,
  comment_count integer not null default 0,
  tags text[],
  created_at timestamp not null default now()
);

create table if not exists public.users (
  id serial primary key,
  auth_user_id text unique,
  email text not null unique,
  name text not null,
  password_hash text,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

create table if not exists public.sessions (
  id serial primary key,
  user_id serial not null,
  token text not null unique,
  expires_at timestamp not null,
  created_at timestamp not null default now()
);

create table if not exists public.posts (
  id serial primary key,
  type text not null default 'text',
  title text,
  body text not null,
  media_url text,
  created_at timestamp not null default now()
);

create table if not exists public.comments (
  id serial primary key,
  post_id integer not null,
  author_name text not null,
  body text not null,
  created_at timestamp not null default now()
);

create table if not exists public.content_comments (
  id serial primary key,
  content_id integer not null,
  author_name text not null,
  body text not null,
  created_at timestamp not null default now()
);

create table if not exists public.likes (
  id serial primary key,
  user_id integer not null,
  target_type text not null,
  target_id integer not null,
  created_at timestamp not null default now()
);

create unique index if not exists likes_user_target_unique
  on public.likes (user_id, target_type, target_id);

create table if not exists public.purchases (
  id serial primary key,
  user_id integer,
  content_id integer not null,
  content_title text not null,
  customer_email text not null,
  customer_name text not null,
  amount numeric(10, 2) not null,
  status text not null default 'pending',
  payment_method text not null default 'card',
  stripe_payment_intent_id text,
  created_at timestamp not null default now()
);

create table if not exists public.subscriptions (
  id serial primary key,
  user_id integer not null,
  stripe_subscription_id text not null,
  stripe_customer_id text,
  plan text not null,
  status text not null,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

create unique index if not exists subscriptions_stripe_subscription_id_unique
  on public.subscriptions (stripe_subscription_id);

create table if not exists public.inquiries (
  id serial primary key,
  name text not null,
  email text not null,
  whatsapp text,
  message text not null,
  is_read boolean not null default false,
  reply_message text,
  replied_at timestamp,
  created_at timestamp not null default now()
);
