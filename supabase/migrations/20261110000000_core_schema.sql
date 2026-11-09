-- Core schema: organisations, membership, productions, schedule, and the
-- row level security that enforces the role matrix in src/lib/permissions.

create schema if not exists authz;

create type public.org_role as enum ('owner', 'producer', 'department_lead', 'crew', 'viewer');
create type public.production_status as enum ('planning', 'scheduled', 'shooting', 'wrapped', 'archived');
create type public.block_kind as enum ('scene', 'activity', 'setup', 'break');
create type public.block_status as enum ('draft', 'confirmed', 'done', 'cancelled');

create function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Organisations and people ---------------------------------------------------

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,62}$'),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 120),
  avatar_path text,
  locale text not null default 'en',
  time_zone text not null default 'UTC',
  notification_preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  created_at timestamptz not null default now(),
  unique (id, organization_id),
  unique (organization_id, name)
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.org_role not null,
  department_id uuid,
  created_at timestamptz not null default now(),
  unique (organization_id, user_id),
  foreign key (department_id, organization_id) references public.departments (id, organization_id),
  check ((role = 'department_lead') = (department_id is not null))
);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  email text not null check (position('@' in email) > 1),
  role public.org_role not null,
  department_id uuid,
  token_hash text not null unique,
  invited_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '14 days',
  accepted_at timestamptz,
  foreign key (department_id, organization_id) references public.departments (id, organization_id),
  check ((role = 'department_lead') = (department_id is not null))
);

-- Production data ------------------------------------------------------------

create table public.productions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  description text not null default '' check (char_length(description) <= 4000),
  status public.production_status not null default 'planning',
  starts_on date,
  ends_on date,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (id, organization_id),
  check (ends_on is null or starts_on is null or ends_on >= starts_on)
);
create unique index productions_name_unique on public.productions (organization_id, lower(name))
  where deleted_at is null;
create trigger productions_updated_at before update on public.productions
  for each row execute function public.set_updated_at();

create table public.crew_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  full_name text not null check (char_length(full_name) between 1 and 160),
  email text,
  phone text,
  role_title text not null default '',
  department_id uuid,
  preferred_locale text not null default 'en',
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (id, organization_id),
  foreign key (department_id, organization_id) references public.departments (id, organization_id)
);
create unique index crew_members_user_unique on public.crew_members (organization_id, user_id)
  where user_id is not null and deleted_at is null;

create table public.production_crew (
  organization_id uuid not null,
  production_id uuid not null,
  crew_member_id uuid not null,
  primary key (production_id, crew_member_id),
  foreign key (production_id, organization_id) references public.productions (id, organization_id) on delete cascade,
  foreign key (crew_member_id, organization_id) references public.crew_members (id, organization_id) on delete cascade
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  address text not null default '',
  notes text not null default '',
  parking_info text not null default '',
  access_info text not null default '',
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (id, organization_id)
);

create table public.equipment_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  category text not null default '',
  department_id uuid,
  asset_tag text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (id, organization_id),
  foreign key (department_id, organization_id) references public.departments (id, organization_id)
);

create table public.shoot_days (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  production_id uuid not null,
  shoot_date date not null,
  call_time time,
  notes text not null default '',
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (id, organization_id),
  unique (id, production_id),
  foreign key (production_id, organization_id) references public.productions (id, organization_id) on delete cascade
);
create unique index shoot_days_date_unique on public.shoot_days (production_id, shoot_date)
  where deleted_at is null;

create table public.schedule_blocks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  production_id uuid not null,
  shoot_day_id uuid not null,
  title text not null check (char_length(title) between 1 and 160),
  kind public.block_kind not null default 'scene',
  status public.block_status not null default 'draft',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  location_id uuid,
  department_id uuid,
  notes text not null default '' check (char_length(notes) <= 4000),
  version integer not null default 1,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (id, organization_id),
  check (ends_at > starts_at),
  foreign key (shoot_day_id, production_id) references public.shoot_days (id, production_id) on delete cascade,
  foreign key (production_id, organization_id) references public.productions (id, organization_id) on delete cascade,
  foreign key (location_id, organization_id) references public.locations (id, organization_id),
  foreign key (department_id, organization_id) references public.departments (id, organization_id)
);
create index schedule_blocks_day_idx on public.schedule_blocks (shoot_day_id, starts_at);

create function public.bump_block_version() returns trigger
language plpgsql as $$
begin
  new.version = old.version + 1;
  new.updated_at = now();
  return new;
end;
$$;
create trigger schedule_blocks_version before update on public.schedule_blocks
  for each row execute function public.bump_block_version();

create table public.block_crew (
  organization_id uuid not null,
  block_id uuid not null,
  crew_member_id uuid not null,
  primary key (block_id, crew_member_id),
  foreign key (block_id, organization_id) references public.schedule_blocks (id, organization_id) on delete cascade,
  foreign key (crew_member_id, organization_id) references public.crew_members (id, organization_id) on delete cascade
);

create table public.block_equipment (
  organization_id uuid not null,
  block_id uuid not null,
  equipment_item_id uuid not null,
  primary key (block_id, equipment_item_id),
  foreign key (block_id, organization_id) references public.schedule_blocks (id, organization_id) on delete cascade,
  foreign key (equipment_item_id, organization_id) references public.equipment_items (id, organization_id) on delete cascade
);

create table public.block_acknowledgements (
  organization_id uuid not null,
  block_id uuid not null,
  crew_member_id uuid not null,
  acknowledged_at timestamptz not null default now(),
  primary key (block_id, crew_member_id),
  foreign key (block_id, organization_id) references public.schedule_blocks (id, organization_id) on delete cascade,
  foreign key (crew_member_id, organization_id) references public.crew_members (id, organization_id) on delete cascade
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  block_id uuid not null,
  author_id uuid not null references auth.users (id),
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now(),
  foreign key (block_id, organization_id) references public.schedule_blocks (id, organization_id) on delete cascade
);

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  production_id uuid,
  location_id uuid,
  uploaded_by uuid not null references auth.users (id),
  storage_path text not null,
  file_name text not null check (char_length(file_name) between 1 and 255),
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (production_id is not null or location_id is not null),
  foreign key (production_id, organization_id) references public.productions (id, organization_id) on delete cascade,
  foreign key (location_id, organization_id) references public.locations (id, organization_id) on delete cascade
);

-- Authorisation helpers ------------------------------------------------------
-- These run as their owner so they can read memberships without triggering the
-- policies on memberships themselves.

create function authz.role_in(org uuid) returns public.org_role
language sql stable security definer set search_path = '' as $$
  select m.role from public.memberships m
  where m.organization_id = org and m.user_id = auth.uid()
$$;

create function authz.department_in(org uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select m.department_id from public.memberships m
  where m.organization_id = org and m.user_id = auth.uid()
$$;

create function authz.is_member(org uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select authz.role_in(org) is not null
$$;

create function authz.is_owner(org uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select authz.role_in(org) = 'owner'
$$;

create function authz.can_manage(org uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(authz.role_in(org) in ('owner', 'producer'), false)
$$;

create function authz.is_crew(org uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select authz.role_in(org) = 'crew'
$$;

create function authz.can_read_production(org uuid, production uuid) returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare
  member_role public.org_role := authz.role_in(org);
begin
  if member_role is null then
    return false;
  end if;
  if member_role <> 'crew' then
    return true;
  end if;
  return exists (
    select 1
    from public.production_crew pc
    join public.crew_members cm on cm.id = pc.crew_member_id and cm.organization_id = pc.organization_id
    where pc.production_id = production
      and pc.organization_id = org
      and cm.user_id = auth.uid()
      and cm.deleted_at is null
  );
end;
$$;

create function authz.can_read_block(block uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select authz.can_read_production(b.organization_id, b.production_id)
       from public.schedule_blocks b where b.id = block),
    false)
$$;

create function authz.can_write_block(org uuid, department uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select case authz.role_in(org)
    when 'owner' then true
    when 'producer' then true
    when 'department_lead' then department is not null and department = authz.department_in(org)
    else false
  end
$$;

create function authz.can_write_block_row(block uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select authz.can_write_block(b.organization_id, b.department_id)
       from public.schedule_blocks b where b.id = block),
    false)
$$;

create function authz.crew_sees_location(location uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.schedule_blocks b
    where b.location_id = location and b.deleted_at is null
      and authz.can_read_production(b.organization_id, b.production_id)
  )
$$;

create function authz.crew_sees_equipment(item uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.block_equipment be
    join public.schedule_blocks b on b.id = be.block_id and b.organization_id = be.organization_id
    where be.equipment_item_id = item and b.deleted_at is null
      and authz.can_read_production(b.organization_id, b.production_id)
  )
$$;

create function authz.crew_sees_crew_member(member uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.crew_members cm where cm.id = member and cm.user_id = auth.uid()
  ) or exists (
    select 1
    from public.production_crew theirs
    join public.production_crew mine on mine.production_id = theirs.production_id
    join public.crew_members me on me.id = mine.crew_member_id
    where theirs.crew_member_id = member and me.user_id = auth.uid() and me.deleted_at is null
  )
$$;

create function authz.owns_crew_member(member uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.crew_members cm
    where cm.id = member and cm.user_id = auth.uid() and cm.deleted_at is null
  )
$$;

create function authz.shares_organization(other uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.memberships mine
    join public.memberships theirs on theirs.organization_id = mine.organization_id
    where mine.user_id = auth.uid() and theirs.user_id = other
  )
$$;

-- Bootstrap and invariants ---------------------------------------------------

create function public.create_organization(org_name text, org_slug text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  new_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;
  insert into public.organizations (name, slug) values (org_name, org_slug) returning id into new_id;
  insert into public.memberships (organization_id, user_id, role) values (new_id, auth.uid(), 'owner');
  return new_id;
end;
$$;

create function public.keep_one_owner() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.role = 'owner' and (tg_op = 'DELETE' or new.role <> 'owner') then
    if not exists (
      select 1 from public.memberships m
      where m.organization_id = old.organization_id and m.role = 'owner' and m.id <> old.id
    ) then
      raise exception 'an organization must keep at least one owner' using errcode = '23514';
    end if;
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;
create trigger memberships_keep_one_owner before update or delete on public.memberships
  for each row execute function public.keep_one_owner();

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''));
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row level security ---------------------------------------------------------

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.departments enable row level security;
alter table public.memberships enable row level security;
alter table public.invitations enable row level security;
alter table public.productions enable row level security;
alter table public.crew_members enable row level security;
alter table public.production_crew enable row level security;
alter table public.locations enable row level security;
alter table public.equipment_items enable row level security;
alter table public.shoot_days enable row level security;
alter table public.schedule_blocks enable row level security;
alter table public.block_crew enable row level security;
alter table public.block_equipment enable row level security;
alter table public.block_acknowledgements enable row level security;
alter table public.comments enable row level security;
alter table public.attachments enable row level security;

create policy organizations_select on public.organizations for select to authenticated
  using (authz.is_member(id));
create policy organizations_update on public.organizations for update to authenticated
  using (authz.is_owner(id)) with check (authz.is_owner(id));

create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or authz.shares_organization(id));
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy departments_select on public.departments for select to authenticated
  using (authz.is_member(organization_id));
create policy departments_write on public.departments for all to authenticated
  using (authz.can_manage(organization_id)) with check (authz.can_manage(organization_id));

create policy memberships_select on public.memberships for select to authenticated
  using (user_id = auth.uid() or (authz.is_member(organization_id) and not authz.is_crew(organization_id)));
create policy memberships_owner_write on public.memberships for all to authenticated
  using (authz.is_owner(organization_id)) with check (authz.is_owner(organization_id));

create policy invitations_owner on public.invitations for all to authenticated
  using (authz.is_owner(organization_id)) with check (authz.is_owner(organization_id));

create policy productions_select on public.productions for select to authenticated
  using (authz.can_read_production(organization_id, id)
         and (deleted_at is null or authz.can_manage(organization_id)));
create policy productions_write on public.productions for all to authenticated
  using (authz.can_manage(organization_id)) with check (authz.can_manage(organization_id));

create policy shoot_days_select on public.shoot_days for select to authenticated
  using (authz.can_read_production(organization_id, production_id)
         and (deleted_at is null or authz.can_manage(organization_id)));
create policy shoot_days_write on public.shoot_days for all to authenticated
  using (authz.can_manage(organization_id)) with check (authz.can_manage(organization_id));

create policy production_crew_select on public.production_crew for select to authenticated
  using (authz.can_read_production(organization_id, production_id));
create policy production_crew_write on public.production_crew for all to authenticated
  using (authz.can_manage(organization_id)) with check (authz.can_manage(organization_id));

create policy locations_select on public.locations for select to authenticated
  using (authz.is_member(organization_id)
         and (not authz.is_crew(organization_id) or authz.crew_sees_location(id))
         and (deleted_at is null or authz.can_manage(organization_id)));
create policy locations_write on public.locations for all to authenticated
  using (authz.can_manage(organization_id)) with check (authz.can_manage(organization_id));

create policy crew_members_select on public.crew_members for select to authenticated
  using (authz.is_member(organization_id)
         and (not authz.is_crew(organization_id) or authz.crew_sees_crew_member(id))
         and (deleted_at is null or authz.can_manage(organization_id)));
create policy crew_members_write on public.crew_members for all to authenticated
  using (authz.can_manage(organization_id)) with check (authz.can_manage(organization_id));

create policy equipment_select on public.equipment_items for select to authenticated
  using (authz.is_member(organization_id)
         and (not authz.is_crew(organization_id) or authz.crew_sees_equipment(id))
         and (deleted_at is null or authz.can_manage(organization_id)));
create policy equipment_write on public.equipment_items for all to authenticated
  using (authz.can_write_block(organization_id, department_id))
  with check (authz.can_write_block(organization_id, department_id));

create policy blocks_select on public.schedule_blocks for select to authenticated
  using (authz.can_read_production(organization_id, production_id)
         and (deleted_at is null or authz.can_manage(organization_id)));
-- Anyone who may edit a block can always see it, including after a soft delete;
-- without this the update that sets deleted_at would fail its own visibility check.
create policy blocks_select_editable on public.schedule_blocks for select to authenticated
  using (authz.can_write_block(organization_id, department_id));
create policy blocks_insert on public.schedule_blocks for insert to authenticated
  with check (authz.can_write_block(organization_id, department_id));
create policy blocks_update on public.schedule_blocks for update to authenticated
  using (authz.can_write_block(organization_id, department_id))
  with check (authz.can_write_block(organization_id, department_id));
create policy blocks_delete on public.schedule_blocks for delete to authenticated
  using (authz.can_write_block(organization_id, department_id));

create policy block_crew_select on public.block_crew for select to authenticated
  using (authz.can_read_block(block_id));
create policy block_crew_write on public.block_crew for all to authenticated
  using (authz.can_write_block_row(block_id)) with check (authz.can_write_block_row(block_id));

create policy block_equipment_select on public.block_equipment for select to authenticated
  using (authz.can_read_block(block_id));
create policy block_equipment_write on public.block_equipment for all to authenticated
  using (authz.can_write_block_row(block_id)) with check (authz.can_write_block_row(block_id));

create policy acknowledgements_select on public.block_acknowledgements for select to authenticated
  using (authz.can_read_block(block_id)
         and (not authz.is_crew(organization_id) or authz.owns_crew_member(crew_member_id)));
create policy acknowledgements_insert on public.block_acknowledgements for insert to authenticated
  with check (
    authz.owns_crew_member(crew_member_id)
    and authz.can_read_block(block_id)
    and exists (
      select 1 from public.block_crew bc
      where bc.block_id = block_acknowledgements.block_id
        and bc.crew_member_id = block_acknowledgements.crew_member_id
    )
  );
create policy acknowledgements_delete on public.block_acknowledgements for delete to authenticated
  using (authz.owns_crew_member(crew_member_id));

create policy comments_select on public.comments for select to authenticated
  using (authz.can_read_block(block_id));
create policy comments_insert on public.comments for insert to authenticated
  with check (
    author_id = auth.uid()
    and authz.role_in(organization_id) in ('owner', 'producer', 'department_lead', 'crew')
    and authz.can_read_block(block_id)
  );
create policy comments_delete on public.comments for delete to authenticated
  using (author_id = auth.uid() or authz.can_manage(organization_id));

create policy attachments_select on public.attachments for select to authenticated
  using (
    authz.is_member(organization_id)
    and (deleted_at is null or authz.can_manage(organization_id))
    and (
      not authz.is_crew(organization_id)
      or (production_id is not null and authz.can_read_production(organization_id, production_id))
      or (location_id is not null and authz.crew_sees_location(location_id))
    )
  );
create policy attachments_select_uploader on public.attachments for select to authenticated
  using (uploaded_by = auth.uid());
create policy attachments_insert on public.attachments for insert to authenticated
  with check (
    uploaded_by = auth.uid()
    and (
      authz.role_in(organization_id) in ('owner', 'producer', 'department_lead')
      or (
        authz.is_crew(organization_id)
        and production_id is not null
        and authz.can_read_production(organization_id, production_id)
      )
    )
  );
create policy attachments_update on public.attachments for update to authenticated
  using (uploaded_by = auth.uid() or authz.can_manage(organization_id))
  with check (uploaded_by = auth.uid() or authz.can_manage(organization_id));

-- Privileges -----------------------------------------------------------------

revoke all on all tables in schema public from anon;
revoke all on all functions in schema authz from public;
grant usage on schema authz to authenticated;
grant execute on all functions in schema authz to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on function public.create_organization(text, text) to authenticated;
