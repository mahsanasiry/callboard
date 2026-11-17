-- Fields the equipment and crew lists need: status, notes and unique names.

create type public.equipment_status as enum ('available', 'in_use', 'maintenance', 'retired');

alter table public.equipment_items
  add column status public.equipment_status not null default 'available',
  add column notes text not null default '' check (char_length(notes) <= 2000),
  add column updated_at timestamptz not null default now();

create unique index equipment_name_unique on public.equipment_items (organization_id, lower(name))
  where deleted_at is null;
create index equipment_list_idx on public.equipment_items (organization_id, deleted_at, name);
create trigger equipment_items_updated_at before update on public.equipment_items
  for each row execute function public.set_updated_at();

alter table public.crew_members
  add column notes text not null default '' check (char_length(notes) <= 2000),
  add column updated_at timestamptz not null default now();

create index crew_list_idx on public.crew_members (organization_id, deleted_at, full_name);
create trigger crew_members_updated_at before update on public.crew_members
  for each row execute function public.set_updated_at();
