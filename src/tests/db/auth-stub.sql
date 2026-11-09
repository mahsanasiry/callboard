-- Minimal stand-in for the parts of Supabase that the migrations rely on.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;

create schema auth;
create table auth.users (
  id uuid primary key,
  email text,
  raw_user_meta_data jsonb not null default '{}'::jsonb
);

create function auth.uid() returns uuid
language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

grant usage on schema public to anon, authenticated;
grant usage on schema auth to authenticated;
grant execute on function auth.uid() to anon, authenticated;
