// @vitest-environment node
import type { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  can,
  type Permission,
  type ResourceContext,
  type Role,
  type Subject,
} from '@/lib/permissions/policy';
import { orgAActors, ids, seed, type ActorName } from './fixtures';
import { createDatabase, runAs } from './harness';

const { orgA, productions, blocks, days, locations, equipment, crewMembers, users } = ids;

const ROLE_OF: Record<ActorName, Role | null> = {
  owner: 'owner',
  producer: 'producer',
  leadCamera: 'department_lead',
  leadSound: 'department_lead',
  crew1: 'crew',
  crew2: 'crew',
  viewer: 'viewer',
  ownerB: null,
  stranger: null,
};

const DEPARTMENT_OF: Partial<Record<ActorName, string>> = {
  leadCamera: ids.deptCamera,
  leadSound: ids.deptSound,
};

const ASSIGNED_TO: Partial<Record<ActorName, string[]>> = {
  crew1: [productions.p1],
  crew2: [productions.p2],
};

function subjectFor(actor: ActorName): Subject | null {
  const role = ROLE_OF[actor];
  if (role === null) return null;
  return {
    userId: users[actor],
    role,
    departmentId: DEPARTMENT_OF[actor] ?? null,
    assignedProductionIds: new Set(ASSIGNED_TO[actor] ?? []),
  };
}

interface Scenario {
  readonly name: string;
  readonly permission: Permission;
  readonly sql: (actor: ActorName) => string;
  readonly context?: (actor: ActorName) => ResourceContext;
}

const insertBlock = (department: string) => `
  insert into public.schedule_blocks
    (organization_id, production_id, shoot_day_id, title, starts_at, ends_at, department_id)
  values ('${orgA}', '${productions.p1}', '${days.d1}', 'New block',
    '2026-12-01T12:00:00Z', '2026-12-01T13:00:00Z', '${department}')`;

const SCENARIOS: readonly Scenario[] = [
  {
    name: 'read the organisation',
    permission: 'organization:read',
    sql: () => `select id from public.organizations where id = '${orgA}'`,
  },
  {
    name: 'rename the organisation',
    permission: 'organization:update',
    sql: () => `update public.organizations set name = 'Renamed' where id = '${orgA}'`,
  },
  {
    name: 'read another member',
    permission: 'member:read',
    sql: () => `select id from public.memberships where user_id = '${users.viewer}'`,
    context: () => ({ ownerUserId: users.viewer }),
  },
  {
    name: 'read their own membership',
    permission: 'member:read',
    sql: (actor) => `select id from public.memberships where user_id = '${users[actor]}'`,
    context: (actor) => ({ ownerUserId: users[actor] }),
  },
  {
    name: 'invite a member',
    permission: 'member:invite',
    sql: (actor) => `
      insert into public.invitations (organization_id, email, role, token_hash, invited_by)
      values ('${orgA}', 'new@example.test', 'viewer', 'hash-1', '${users[actor]}')`,
  },
  {
    name: 'change a role',
    permission: 'member:changeRole',
    sql: () => `update public.memberships set role = 'viewer' where user_id = '${users.crew2}'`,
  },
  {
    name: 'remove a member',
    permission: 'member:remove',
    sql: () => `delete from public.memberships where user_id = '${users.crew2}'`,
  },

  {
    name: 'read an assigned production',
    permission: 'production:read',
    sql: () => `select id from public.productions where id = '${productions.p1}'`,
    context: () => ({ productionId: productions.p1 }),
  },
  {
    name: 'read a production they are not on',
    permission: 'production:read',
    sql: () => `select id from public.productions where id = '${productions.p2}'`,
    context: () => ({ productionId: productions.p2 }),
  },
  {
    name: 'create a production',
    permission: 'production:create',
    sql: () => `insert into public.productions (organization_id, name) values ('${orgA}', 'Fresh')`,
  },
  {
    name: 'edit a production',
    permission: 'production:update',
    sql: () => `update public.productions set name = 'Edited' where id = '${productions.p1}'`,
  },
  {
    name: 'archive a production',
    permission: 'production:delete',
    sql: () => `update public.productions set deleted_at = now() where id = '${productions.p1}'`,
  },

  {
    name: 'read a shoot day',
    permission: 'shootDay:read',
    sql: () => `select id from public.shoot_days where id = '${days.d1}'`,
    context: () => ({ productionId: productions.p1 }),
  },
  {
    name: 'read a shoot day of another production',
    permission: 'shootDay:read',
    sql: () => `select id from public.shoot_days where id = '${days.d2}'`,
    context: () => ({ productionId: productions.p2 }),
  },
  {
    name: 'add a shoot day',
    permission: 'shootDay:create',
    sql: () => `
      insert into public.shoot_days (organization_id, production_id, shoot_date)
      values ('${orgA}', '${productions.p1}', '2027-01-04')`,
  },
  {
    name: 'edit a shoot day',
    permission: 'shootDay:update',
    sql: () => `update public.shoot_days set notes = 'Early start' where id = '${days.d1}'`,
  },
  {
    name: 'remove a shoot day',
    permission: 'shootDay:delete',
    sql: () => `update public.shoot_days set deleted_at = now() where id = '${days.d1}'`,
  },

  {
    name: 'read a block',
    permission: 'block:read',
    sql: () => `select id from public.schedule_blocks where id = '${blocks.b1}'`,
    context: () => ({ productionId: productions.p1, departmentId: ids.deptCamera }),
  },
  {
    name: 'read a block of another production',
    permission: 'block:read',
    sql: () => `select id from public.schedule_blocks where id = '${blocks.b3}'`,
    context: () => ({ productionId: productions.p2, departmentId: ids.deptCamera }),
  },
  {
    name: 'create a camera block',
    permission: 'block:create',
    sql: () => insertBlock(ids.deptCamera),
    context: () => ({ productionId: productions.p1, departmentId: ids.deptCamera }),
  },
  {
    name: 'create a sound block',
    permission: 'block:create',
    sql: () => insertBlock(ids.deptSound),
    context: () => ({ productionId: productions.p1, departmentId: ids.deptSound }),
  },
  {
    name: 'edit a camera block',
    permission: 'block:update',
    sql: () => `update public.schedule_blocks set notes = 'Wider lens' where id = '${blocks.b1}'`,
    context: () => ({ productionId: productions.p1, departmentId: ids.deptCamera }),
  },
  {
    name: 'edit a sound block',
    permission: 'block:update',
    sql: () => `update public.schedule_blocks set notes = 'More cable' where id = '${blocks.b2}'`,
    context: () => ({ productionId: productions.p1, departmentId: ids.deptSound }),
  },
  {
    name: 'remove a camera block',
    permission: 'block:delete',
    sql: () => `update public.schedule_blocks set deleted_at = now() where id = '${blocks.b1}'`,
    context: () => ({ productionId: productions.p1, departmentId: ids.deptCamera }),
  },
  {
    name: 'remove a sound block',
    permission: 'block:delete',
    sql: () => `update public.schedule_blocks set deleted_at = now() where id = '${blocks.b2}'`,
    context: () => ({ productionId: productions.p1, departmentId: ids.deptSound }),
  },
  {
    name: 'acknowledge a call time for crew member one',
    permission: 'block:acknowledge',
    sql: () => `
      insert into public.block_acknowledgements (organization_id, block_id, crew_member_id)
      values ('${orgA}', '${blocks.b1}', '${crewMembers.cm1}')`,
    context: () => ({ productionId: productions.p1, ownerUserId: users.crew1 }),
  },

  {
    name: 'read a location used in their production',
    permission: 'location:read',
    sql: () => `select id from public.locations where id = '${locations.l1}'`,
    context: () => ({ productionIds: [productions.p1] }),
  },
  {
    name: 'read a location used in another production',
    permission: 'location:read',
    sql: () => `select id from public.locations where id = '${locations.l2}'`,
    context: () => ({ productionIds: [productions.p2] }),
  },
  {
    name: 'read a location nobody uses yet',
    permission: 'location:read',
    sql: () => `select id from public.locations where id = '${locations.l3}'`,
    context: () => ({ productionIds: [] }),
  },
  {
    name: 'add a location',
    permission: 'location:create',
    sql: () => `insert into public.locations (organization_id, name) values ('${orgA}', 'Quarry')`,
  },
  {
    name: 'edit a location',
    permission: 'location:update',
    sql: () =>
      `update public.locations set notes = 'Gate code changed' where id = '${locations.l1}'`,
  },
  {
    name: 'remove a location',
    permission: 'location:delete',
    sql: () => `update public.locations set deleted_at = now() where id = '${locations.l1}'`,
  },

  {
    name: 'read a crew member on their production',
    permission: 'crewMember:read',
    sql: () => `select id from public.crew_members where id = '${crewMembers.cm1}'`,
    context: () => ({ ownerUserId: users.crew1, productionIds: [productions.p1] }),
  },
  {
    name: 'read a crew member without an account on their production',
    permission: 'crewMember:read',
    sql: () => `select id from public.crew_members where id = '${crewMembers.free}'`,
    context: () => ({ ownerUserId: null, productionIds: [productions.p1] }),
  },
  {
    name: 'read a crew member on another production',
    permission: 'crewMember:read',
    sql: () => `select id from public.crew_members where id = '${crewMembers.cm2}'`,
    context: () => ({ ownerUserId: users.crew2, productionIds: [productions.p2] }),
  },
  {
    name: 'add a crew member',
    permission: 'crewMember:create',
    sql: () =>
      `insert into public.crew_members (organization_id, full_name) values ('${orgA}', 'New Hire')`,
  },
  {
    name: 'edit a crew member',
    permission: 'crewMember:update',
    sql: () => `update public.crew_members set phone = '555-0100' where id = '${crewMembers.free}'`,
  },
  {
    name: 'remove a crew member',
    permission: 'crewMember:delete',
    sql: () => `update public.crew_members set deleted_at = now() where id = '${crewMembers.free}'`,
  },

  {
    name: 'read camera equipment used in their production',
    permission: 'equipment:read',
    sql: () => `select id from public.equipment_items where id = '${equipment.camera}'`,
    context: () => ({
      productionIds: [productions.p1, productions.p2],
      departmentId: ids.deptCamera,
    }),
  },
  {
    name: 'read sound equipment used in their production',
    permission: 'equipment:read',
    sql: () => `select id from public.equipment_items where id = '${equipment.sound}'`,
    context: () => ({ productionIds: [productions.p1], departmentId: ids.deptSound }),
  },
  {
    name: 'add camera equipment',
    permission: 'equipment:create',
    sql: () => `
      insert into public.equipment_items (organization_id, name, department_id)
      values ('${orgA}', 'Spare lens', '${ids.deptCamera}')`,
    context: () => ({ departmentId: ids.deptCamera }),
  },
  {
    name: 'add sound equipment',
    permission: 'equipment:create',
    sql: () => `
      insert into public.equipment_items (organization_id, name, department_id)
      values ('${orgA}', 'Spare mic', '${ids.deptSound}')`,
    context: () => ({ departmentId: ids.deptSound }),
  },
  {
    name: 'edit camera equipment',
    permission: 'equipment:update',
    sql: () =>
      `update public.equipment_items set category = 'Optics' where id = '${equipment.camera}'`,
    context: () => ({ departmentId: ids.deptCamera }),
  },
  {
    name: 'edit sound equipment',
    permission: 'equipment:update',
    sql: () =>
      `update public.equipment_items set category = 'Audio' where id = '${equipment.sound}'`,
    context: () => ({ departmentId: ids.deptSound }),
  },
  {
    name: 'remove camera equipment',
    permission: 'equipment:delete',
    sql: () =>
      `update public.equipment_items set deleted_at = now() where id = '${equipment.camera}'`,
    context: () => ({ departmentId: ids.deptCamera }),
  },

  {
    name: 'read comments on an assigned production',
    permission: 'comment:read',
    sql: () => `select id from public.comments where id = '${ids.comment}'`,
    context: () => ({ productionId: productions.p1 }),
  },
  {
    name: 'write a comment',
    permission: 'comment:create',
    sql: (actor) => `
      insert into public.comments (organization_id, block_id, author_id, body)
      values ('${orgA}', '${blocks.b1}', '${users[actor]}', 'On my way.')`,
    context: () => ({ productionId: productions.p1 }),
  },
  {
    name: 'delete a comment written by crew member one',
    permission: 'comment:delete',
    sql: () => `delete from public.comments where id = '${ids.comment}'`,
    context: () => ({ productionId: productions.p1, ownerUserId: users.crew1 }),
  },

  {
    name: 'read an attachment on an assigned production',
    permission: 'attachment:read',
    sql: () => `select id from public.attachments where id = '${ids.attachment}'`,
    context: () => ({ productionId: productions.p1 }),
  },
  {
    name: 'upload to the first production',
    permission: 'attachment:upload',
    sql: (actor) => `
      insert into public.attachments
        (organization_id, production_id, uploaded_by, storage_path, file_name, mime_type, size_bytes)
      values ('${orgA}', '${productions.p1}', '${users[actor]}', 'org/new.jpg', 'new.jpg', 'image/jpeg', 2048)`,
    context: () => ({ productionId: productions.p1 }),
  },
  {
    name: 'upload to the second production',
    permission: 'attachment:upload',
    sql: (actor) => `
      insert into public.attachments
        (organization_id, production_id, uploaded_by, storage_path, file_name, mime_type, size_bytes)
      values ('${orgA}', '${productions.p2}', '${users[actor]}', 'org/new.jpg', 'new.jpg', 'image/jpeg', 2048)`,
    context: () => ({ productionId: productions.p2 }),
  },
  {
    name: 'remove an attachment uploaded by crew member one',
    permission: 'attachment:delete',
    sql: () => `update public.attachments set deleted_at = now() where id = '${ids.attachment}'`,
    context: () => ({ productionId: productions.p1, ownerUserId: users.crew1 }),
  },
];

let db: PGlite;

beforeAll(async () => {
  db = await createDatabase();
  await seed(db);
}, 60_000);

afterAll(async () => {
  await db.close();
});

describe('row level security agrees with the shared permission policy', () => {
  for (const scenario of SCENARIOS) {
    describe(`${scenario.permission}: ${scenario.name}`, () => {
      it.each(orgAActors)('%s', async (actor) => {
        const subject = subjectFor(actor);
        const expected = can(subject, scenario.permission, scenario.context?.(actor) ?? {}).allowed;

        const outcome = await runAs(db, users[actor], scenario.sql(actor));
        const actual = outcome.ok && outcome.affected > 0;

        expect(
          actual,
          `${actor} ${actual ? 'was allowed' : 'was denied'} by the database${
            outcome.error ? ` (${outcome.error})` : ''
          } but the policy says ${expected ? 'allowed' : 'denied'}`,
        ).toBe(expected);
      });
    });
  }
});
