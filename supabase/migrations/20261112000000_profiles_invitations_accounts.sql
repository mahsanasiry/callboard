-- Profile preferences, invitations that can be accepted, and account deletion.

-- Demo accounts are shared by many visitors, so their memberships and the
-- accounts themselves are protected from being changed through the API.
alter table public.profiles add column is_demo boolean not null default false;

alter table public.profiles
  alter column notification_preferences
  set default '{"assigned":true,"callTimeChanged":true,"conflict":true,"mention":true,"attachment":true}'::jsonb;
update public.profiles
  set notification_preferences = '{"assigned":true,"callTimeChanged":true,"conflict":true,"mention":true,"attachment":true}'::jsonb
  where notification_preferences = '{}'::jsonb;

-- People may edit their own preferences but never the flag that protects them.
revoke update on public.profiles from authenticated;
grant update (display_name, avatar_path, locale, time_zone, notification_preferences)
  on public.profiles to authenticated;

-- Deleting an account must not be blocked by, or take away, the work around it.
alter table public.productions drop constraint productions_created_by_fkey;
alter table public.productions
  add constraint productions_created_by_fkey foreign key (created_by) references auth.users (id) on delete set null;

alter table public.schedule_blocks drop constraint schedule_blocks_created_by_fkey;
alter table public.schedule_blocks
  add constraint schedule_blocks_created_by_fkey foreign key (created_by) references auth.users (id) on delete set null;

alter table public.invitations drop constraint invitations_invited_by_fkey;
alter table public.invitations
  add constraint invitations_invited_by_fkey foreign key (invited_by) references auth.users (id) on delete cascade;

alter table public.comments alter column author_id drop not null;
alter table public.comments drop constraint comments_author_id_fkey;
alter table public.comments
  add constraint comments_author_id_fkey foreign key (author_id) references auth.users (id) on delete set null;

alter table public.attachments alter column uploaded_by drop not null;
alter table public.attachments drop constraint attachments_uploaded_by_fkey;
alter table public.attachments
  add constraint attachments_uploaded_by_fkey foreign key (uploaded_by) references auth.users (id) on delete set null;

create function public.protect_demo_memberships() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is not null and exists (
    select 1 from public.profiles p where p.id = old.user_id and p.is_demo
  ) then
    raise exception 'demo memberships cannot be changed' using errcode = '42501';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;
create trigger memberships_protect_demo before update or delete on public.memberships
  for each row execute function public.protect_demo_memberships();

-- The caller sends the hash of the invitation token, never the token itself.
create function public.accept_invitation(invitation_hash text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  invite public.invitations;
  account_email text;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  select * into invite from public.invitations
  where token_hash = invitation_hash and accepted_at is null and expires_at > now();
  if not found then
    raise exception 'invitation is not valid' using errcode = 'P0002';
  end if;

  select lower(u.email) into account_email from auth.users u where u.id = auth.uid();
  if account_email is distinct from lower(invite.email) then
    raise exception 'invitation was sent to a different address' using errcode = '42501';
  end if;

  insert into public.memberships (organization_id, user_id, role, department_id)
  values (invite.organization_id, auth.uid(), invite.role, invite.department_id);

  update public.invitations set accepted_at = now() where id = invite.id;
  return invite.organization_id;
end;
$$;

create function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;
  if exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_demo) then
    raise exception 'demo accounts cannot be deleted' using errcode = '42501';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.accept_invitation(text) from public;
revoke all on function public.delete_my_account() from public;
grant execute on function public.accept_invitation(text) to authenticated;
grant execute on function public.delete_my_account() to authenticated;
