import type { PGlite } from '@electric-sql/pglite';

function id(group: number, index: number): string {
  return `${group.toString(16).padStart(8, '0')}-0000-4000-8000-${index.toString(16).padStart(12, '0')}`;
}

export const ids = {
  orgA: id(1, 1),
  orgB: id(1, 2),
  deptCamera: id(2, 1),
  deptSound: id(2, 2),
  deptB: id(2, 3),
  users: {
    owner: id(3, 1),
    producer: id(3, 2),
    leadCamera: id(3, 3),
    leadSound: id(3, 4),
    crew1: id(3, 5),
    crew2: id(3, 6),
    viewer: id(3, 7),
    ownerB: id(3, 8),
    stranger: id(3, 9),
  },
  crewMembers: { cm1: id(4, 1), cm2: id(4, 2), free: id(4, 3), memberB: id(4, 4) },
  productions: { p1: id(5, 1), p2: id(5, 2), pb: id(5, 3) },
  days: { d1: id(6, 1), d2: id(6, 2), db: id(6, 3) },
  locations: { l1: id(7, 1), l2: id(7, 2), l3: id(7, 3), lb: id(7, 4) },
  equipment: { camera: id(8, 1), sound: id(8, 2), eb: id(8, 3) },
  blocks: { b1: id(9, 1), b2: id(9, 2), b3: id(9, 3), bb: id(9, 4) },
  comment: id(10, 1),
  attachment: id(11, 1),
  extra: (index: number) => id(12, index),
} as const;

export type ActorName = keyof typeof ids.users;

export const orgAActors = [
  'owner',
  'producer',
  'leadCamera',
  'leadSound',
  'crew1',
  'crew2',
  'viewer',
  'stranger',
] as const satisfies readonly ActorName[];

export async function seed(db: PGlite): Promise<void> {
  const u = ids.users;
  await db.exec(`
    insert into auth.users (id, email, raw_user_meta_data) values
      ('${u.owner}', 'owner@example.test', '{"display_name":"Owner"}'),
      ('${u.producer}', 'producer@example.test', '{"display_name":"Producer"}'),
      ('${u.leadCamera}', 'lead-camera@example.test', '{"display_name":"Lead Camera"}'),
      ('${u.leadSound}', 'lead-sound@example.test', '{"display_name":"Lead Sound"}'),
      ('${u.crew1}', 'crew1@example.test', '{"display_name":"Crew One"}'),
      ('${u.crew2}', 'crew2@example.test', '{"display_name":"Crew Two"}'),
      ('${u.viewer}', 'viewer@example.test', '{"display_name":"Viewer"}'),
      ('${u.ownerB}', 'owner-b@example.test', '{"display_name":"Owner B"}'),
      ('${u.stranger}', 'stranger@example.test', '{"display_name":"Stranger"}');

    insert into public.organizations (id, name, slug) values
      ('${ids.orgA}', 'Harbour Light Films', 'harbour-light'),
      ('${ids.orgB}', 'Other Studio', 'other-studio');

    insert into public.departments (id, organization_id, name) values
      ('${ids.deptCamera}', '${ids.orgA}', 'Camera'),
      ('${ids.deptSound}', '${ids.orgA}', 'Sound'),
      ('${ids.deptB}', '${ids.orgB}', 'Camera');

    insert into public.memberships (organization_id, user_id, role, department_id) values
      ('${ids.orgA}', '${u.owner}', 'owner', null),
      ('${ids.orgA}', '${u.producer}', 'producer', null),
      ('${ids.orgA}', '${u.leadCamera}', 'department_lead', '${ids.deptCamera}'),
      ('${ids.orgA}', '${u.leadSound}', 'department_lead', '${ids.deptSound}'),
      ('${ids.orgA}', '${u.crew1}', 'crew', null),
      ('${ids.orgA}', '${u.crew2}', 'crew', null),
      ('${ids.orgA}', '${u.viewer}', 'viewer', null),
      ('${ids.orgB}', '${u.ownerB}', 'owner', null);

    insert into public.crew_members (id, organization_id, user_id, full_name, department_id) values
      ('${ids.crewMembers.cm1}', '${ids.orgA}', '${u.crew1}', 'Crew One', '${ids.deptCamera}'),
      ('${ids.crewMembers.cm2}', '${ids.orgA}', '${u.crew2}', 'Crew Two', '${ids.deptSound}'),
      ('${ids.crewMembers.free}', '${ids.orgA}', null, 'Freelance Gaffer', null),
      ('${ids.crewMembers.memberB}', '${ids.orgB}', null, 'Studio B Grip', null);

    insert into public.productions (id, organization_id, name, status) values
      ('${ids.productions.p1}', '${ids.orgA}', 'Harbour Lights', 'shooting'),
      ('${ids.productions.p2}', '${ids.orgA}', 'Salt Flats', 'planning'),
      ('${ids.productions.pb}', '${ids.orgB}', 'Studio B Pilot', 'planning');

    insert into public.production_crew (organization_id, production_id, crew_member_id) values
      ('${ids.orgA}', '${ids.productions.p1}', '${ids.crewMembers.cm1}'),
      ('${ids.orgA}', '${ids.productions.p1}', '${ids.crewMembers.free}'),
      ('${ids.orgA}', '${ids.productions.p2}', '${ids.crewMembers.cm2}');

    insert into public.locations (id, organization_id, name) values
      ('${ids.locations.l1}', '${ids.orgA}', 'Old Dock'),
      ('${ids.locations.l2}', '${ids.orgA}', 'Salt Pan'),
      ('${ids.locations.l3}', '${ids.orgA}', 'Unused Warehouse'),
      ('${ids.locations.lb}', '${ids.orgB}', 'Studio B Lot');

    insert into public.equipment_items (id, organization_id, name, department_id) values
      ('${ids.equipment.camera}', '${ids.orgA}', 'Cine Camera A', '${ids.deptCamera}'),
      ('${ids.equipment.sound}', '${ids.orgA}', 'Boom Kit', '${ids.deptSound}'),
      ('${ids.equipment.eb}', '${ids.orgB}', 'B Rig', '${ids.deptB}');

    insert into public.shoot_days (id, organization_id, production_id, shoot_date) values
      ('${ids.days.d1}', '${ids.orgA}', '${ids.productions.p1}', '2026-12-01'),
      ('${ids.days.d2}', '${ids.orgA}', '${ids.productions.p2}', '2026-12-05'),
      ('${ids.days.db}', '${ids.orgB}', '${ids.productions.pb}', '2026-12-02');

    insert into public.schedule_blocks
      (id, organization_id, production_id, shoot_day_id, title, starts_at, ends_at, location_id, department_id) values
      ('${ids.blocks.b1}', '${ids.orgA}', '${ids.productions.p1}', '${ids.days.d1}', 'Dock arrival',
        '2026-12-01T07:00:00Z', '2026-12-01T09:00:00Z', '${ids.locations.l1}', '${ids.deptCamera}'),
      ('${ids.blocks.b2}', '${ids.orgA}', '${ids.productions.p1}', '${ids.days.d1}', 'Boom setup',
        '2026-12-01T07:30:00Z', '2026-12-01T08:30:00Z', '${ids.locations.l1}', '${ids.deptSound}'),
      ('${ids.blocks.b3}', '${ids.orgA}', '${ids.productions.p2}', '${ids.days.d2}', 'Salt pan wide',
        '2026-12-05T06:00:00Z', '2026-12-05T10:00:00Z', '${ids.locations.l2}', '${ids.deptCamera}'),
      ('${ids.blocks.bb}', '${ids.orgB}', '${ids.productions.pb}', '${ids.days.db}', 'B scene',
        '2026-12-02T06:00:00Z', '2026-12-02T10:00:00Z', '${ids.locations.lb}', '${ids.deptB}');

    insert into public.block_crew (organization_id, block_id, crew_member_id) values
      ('${ids.orgA}', '${ids.blocks.b1}', '${ids.crewMembers.cm1}'),
      ('${ids.orgA}', '${ids.blocks.b2}', '${ids.crewMembers.free}'),
      ('${ids.orgA}', '${ids.blocks.b3}', '${ids.crewMembers.cm2}');

    insert into public.block_equipment (organization_id, block_id, equipment_item_id) values
      ('${ids.orgA}', '${ids.blocks.b1}', '${ids.equipment.camera}'),
      ('${ids.orgA}', '${ids.blocks.b2}', '${ids.equipment.sound}'),
      ('${ids.orgA}', '${ids.blocks.b3}', '${ids.equipment.camera}');

    insert into public.comments (id, organization_id, block_id, author_id, body) values
      ('${ids.comment}', '${ids.orgA}', '${ids.blocks.b1}', '${u.crew1}', 'Parking is on the east side.');

    insert into public.attachments
      (id, organization_id, production_id, uploaded_by, storage_path, file_name, mime_type, size_bytes) values
      ('${ids.attachment}', '${ids.orgA}', '${ids.productions.p1}', '${u.crew1}',
        'org/dock.jpg', 'dock.jpg', 'image/jpeg', 1024);
  `);
}
