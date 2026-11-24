# Supabase setup

The first migration bootstraps the application's current PostgreSQL schema for
a new Supabase database. The second adds private fan-to-creator conversations,
messages, notifications, row-level security policies, and minimal public feed
events for Realtime invalidation. The migrations contain no seed data and have
not been applied to any database.

The schema bootstrap uses `CREATE TABLE IF NOT EXISTS`; it does not reconcile
an existing database's columns, constraints, or indexes. For a database that
already contains application data, compare its schema and migration history
with both migrations before applying anything. Do not treat the bootstrap
migration as a data migration.

## Local validation

With the Supabase CLI installed, start the local stack and apply the migrations:

```sh
supabase start
supabase db reset
```

`db reset` recreates the local database. Do not use it against a hosted project.

The client listens to `feed_events`, not the underlying content tables, so
public Realtime subscriptions reveal only resource type and ID. The same
minimal events invalidate comment and like queries. Private messages and
notifications are subscribed to under their respective row-level security
policies.

## Hosted setup

1. Link the CLI to the intended Supabase project and take a verified,
   restorable backup before applying schema changes.
2. Apply the migration with `supabase db push` after reviewing the target
   project's migration history and schema.
3. Create or confirm the creator's Supabase Auth account, then add that
   account's UUID to `public.creator_roles` using a privileged database
   connection. The unique index intentionally permits only one creator.
4. Configure the client with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`,
   and the API with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Keep the
   service-role key server-side; never expose it to the client.

Creator sign-in now uses Supabase Auth and requires membership in
`public.creator_roles`. The old shared creator password/token is no longer
accepted.
