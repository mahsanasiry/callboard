// @vitest-environment node
import type { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ids, seed } from './fixtures';
import { createDatabase, runAs, runAsAnonymous } from './harness';

const { users, orgA, orgB, productions, blocks } = ids;

const TABLES = [
  'organizations',
  'profiles',
  'departments',
  'memberships',
  'invitations',
  'productions',
  'crew_members',
  'production_crew',
  'locations',
  'equipment_items',
  'shoot_days',
  'schedule_blocks',
  'block_crew',
  'block_equipment',
  'block_acknowledgements',
  'comments',
  'attachments',
] as const;

let db: PGlite;

beforeAll(async () => {
  db = await createDatabase();
  await seed(db);
}, 60_000);

afterAll(async () => {
  await db.close();
});

describe('every table is protected', () => {
  it('has row level security enabled on every public table', async () => {
    const result = await db.query<{ relname: string; relrowsecurity: boolean }>(`
      select c.relname, c.relrowsecurity
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r'
      order by c.relname`);
    const unprotected = result.rows.filter((row) => !row.relrowsecurity).map((row) => row.relname);
    expect(unprotected).toEqual([]);
    expect(result.rows.map((row) => row.relname).sort()).toEqual([...TABLES].sort());
  });

  it.each(TABLES)('shows nothing in %s to a signed-out visitor', async (table) => {
    const outcome = await runAsAnonymous(db, `select * from public.${table}`);
    expect(outcome.ok).toBe(false);
  });

  it.each(TABLES)('shows nothing in %s to a user who belongs to no organisation', async (table) => {
    const outcome = await runAs(db, users.stranger, `select * from public.${table}`);
    expect(outcome.ok).toBe(true);
    const visible = outcome.rows.filter((row) => !('id' in row) || row.id !== users.stranger);
    expect(visible).toEqual([]);
  });
});

describe('organisations cannot see each other', () => {
  const TENANT_TABLES = TABLES.filter((table) => table !== 'profiles');

  it.each(TENANT_TABLES)('keeps %s of organisation A away from the owner of B', async (table) => {
    const column = table === 'organizations' ? 'id' : 'organization_id';
    const outcome = await runAs(
      db,
      users.ownerB,
      `select * from public.${table} where ${column} = '${orgA}'`,
    );
    expect(outcome.ok).toBe(true);
    expect(outcome.rows).toEqual([]);
  });

  it.each(TENANT_TABLES.filter((table) => table !== 'organizations'))(
    'keeps %s of organisation B away from the owner of A',
    async (table) => {
      const outcome = await runAs(
        db,
        users.owner,
        `select * from public.${table} where organization_id = '${orgB}'`,
      );
      expect(outcome.ok).toBe(true);
      expect(outcome.rows).toEqual([]);
    },
  );

  it('stops an owner from writing into another organisation', async () => {
    const outcome = await runAs(
      db,
      users.owner,
      `insert into public.productions (organization_id, name) values ('${orgB}', 'Smuggled')`,
    );
    expect(outcome.ok).toBe(false);
  });

  it('stops an owner from editing another organisation', async () => {
    const outcome = await runAs(
      db,
      users.owner,
      `update public.productions set name = 'Hijacked' where id = '${productions.pb}'`,
    );
    expect(outcome.affected).toBe(0);
  });

  it('stops an owner from granting themselves access to another organisation', async () => {
    const outcome = await runAs(
      db,
      users.owner,
      `insert into public.memberships (organization_id, user_id, role)
       values ('${orgB}', '${users.owner}', 'owner')`,
    );
    expect(outcome.ok).toBe(false);
  });

  it('rejects a block that points at another organisation’s location', async () => {
    await expect(
      db.exec(`
        insert into public.schedule_blocks
          (organization_id, production_id, shoot_day_id, title, starts_at, ends_at, location_id)
        values ('${orgA}', '${productions.p1}', '${ids.days.d1}', 'Cross', '2026-12-01T10:00:00Z',
          '2026-12-01T11:00:00Z', '${ids.locations.lb}')`),
    ).rejects.toThrow(/foreign key/i);
  });

  it('rejects a crew assignment that mixes organisations', async () => {
    await expect(
      db.exec(`
        insert into public.production_crew (organization_id, production_id, crew_member_id)
        values ('${orgA}', '${productions.p1}', '${ids.crewMembers.memberB}')`),
    ).rejects.toThrow(/foreign key/i);
  });
});

describe('crew see only what they need', () => {
  it('hides other productions’ blocks, comments and attachments from crew', async () => {
    for (const table of ['schedule_blocks', 'comments', 'attachments', 'shoot_days']) {
      const outcome = await runAs(db, users.crew2, `select * from public.${table}`);
      const production = outcome.rows.some((row) => row.production_id === productions.p1);
      expect(production, table).toBe(false);
    }
    const visible = await runAs(db, users.crew2, 'select id from public.schedule_blocks');
    expect(visible.rows.map((row) => row.id)).toEqual([blocks.b3]);
  });

  it('shows crew only people on their own productions', async () => {
    const outcome = await runAs(db, users.crew1, 'select id from public.crew_members');
    expect(outcome.rows.map((row) => row.id).sort()).toEqual(
      [ids.crewMembers.cm1, ids.crewMembers.free].sort(),
    );
  });

  it('shows crew only their own acknowledgements', async () => {
    await db.exec(`
      insert into public.block_acknowledgements (organization_id, block_id, crew_member_id)
      values ('${orgA}', '${blocks.b1}', '${ids.crewMembers.cm1}')`);
    try {
      expect(
        (await runAs(db, users.crew1, 'select * from public.block_acknowledgements')).rows,
      ).toHaveLength(1);
      expect(
        (await runAs(db, users.crew2, 'select * from public.block_acknowledgements')).rows,
      ).toHaveLength(0);
      expect(
        (await runAs(db, users.producer, 'select * from public.block_acknowledgements')).rows,
      ).toHaveLength(1);
    } finally {
      await db.exec('delete from public.block_acknowledgements');
    }
  });

  it('stops crew acknowledging a block they are not assigned to', async () => {
    const outcome = await runAs(
      db,
      users.crew1,
      `insert into public.block_acknowledgements (organization_id, block_id, crew_member_id)
       values ('${orgA}', '${blocks.b2}', '${ids.crewMembers.cm1}')`,
    );
    expect(outcome.ok).toBe(false);
  });

  it('stops crew writing a comment as someone else', async () => {
    const outcome = await runAs(
      db,
      users.crew1,
      `insert into public.comments (organization_id, block_id, author_id, body)
       values ('${orgA}', '${blocks.b1}', '${users.producer}', 'Forged')`,
    );
    expect(outcome.ok).toBe(false);
  });

  it('stops viewers from commenting', async () => {
    const outcome = await runAs(
      db,
      users.viewer,
      `insert into public.comments (organization_id, block_id, author_id, body)
       values ('${orgA}', '${blocks.b1}', '${users.viewer}', 'Hello')`,
    );
    expect(outcome.ok).toBe(false);
  });

  it('hides the membership list from crew but keeps their own row', async () => {
    const outcome = await runAs(db, users.crew1, 'select user_id from public.memberships');
    expect(outcome.rows.map((row) => row.user_id)).toEqual([users.crew1]);
  });
});

describe('department leads stay inside their department', () => {
  it('stops a lead moving a block into another department', async () => {
    const outcome = await runAs(
      db,
      users.leadCamera,
      `update public.schedule_blocks set department_id = '${ids.deptSound}' where id = '${blocks.b1}'`,
    );
    expect(outcome.ok).toBe(false);
  });

  it('stops a lead taking over another department’s block', async () => {
    const outcome = await runAs(
      db,
      users.leadCamera,
      `update public.schedule_blocks set department_id = '${ids.deptCamera}' where id = '${blocks.b2}'`,
    );
    expect(outcome.affected).toBe(0);
  });

  it('stops a lead assigning crew to another department’s block', async () => {
    const outcome = await runAs(
      db,
      users.leadCamera,
      `insert into public.block_crew (organization_id, block_id, crew_member_id)
       values ('${orgA}', '${blocks.b2}', '${ids.crewMembers.cm1}')`,
    );
    expect(outcome.ok).toBe(false);
  });

  it('lets a lead assign crew to their own department’s block', async () => {
    const outcome = await runAs(
      db,
      users.leadCamera,
      `insert into public.block_crew (organization_id, block_id, crew_member_id)
       values ('${orgA}', '${blocks.b1}', '${ids.crewMembers.free}')`,
    );
    expect(outcome.ok).toBe(true);
  });

  it('stops a lead moving equipment to another department', async () => {
    const outcome = await runAs(
      db,
      users.leadCamera,
      `update public.equipment_items set department_id = '${ids.deptSound}'
       where id = '${ids.equipment.camera}'`,
    );
    expect(outcome.ok).toBe(false);
  });
});

describe('soft deletion', () => {
  it('hides an archived production from crew, leads and viewers but not from producers', async () => {
    await db.exec(
      `update public.productions set deleted_at = now() where id = '${productions.p1}'`,
    );
    try {
      const countFor = async (user: string) =>
        (await runAs(db, user, `select id from public.productions where id = '${productions.p1}'`))
          .rows.length;
      expect(await countFor(users.crew1)).toBe(0);
      expect(await countFor(users.viewer)).toBe(0);
      expect(await countFor(users.leadCamera)).toBe(0);
      expect(await countFor(users.producer)).toBe(1);
      expect(await countFor(users.owner)).toBe(1);
    } finally {
      await db.exec(
        `update public.productions set deleted_at = null where id = '${productions.p1}'`,
      );
    }
  });

  it('allows a production name to be reused after the old one is archived', async () => {
    await db.exec(
      `update public.productions set deleted_at = now() where id = '${productions.p1}'`,
    );
    try {
      const outcome = await runAs(
        db,
        users.producer,
        `insert into public.productions (organization_id, name) values ('${orgA}', 'harbour lights')`,
      );
      expect(outcome.ok).toBe(true);
    } finally {
      await db.exec(
        `update public.productions set deleted_at = null where id = '${productions.p1}'`,
      );
    }
  });

  it('rejects a duplicate active production name regardless of case', async () => {
    const outcome = await runAs(
      db,
      users.producer,
      `insert into public.productions (organization_id, name) values ('${orgA}', 'HARBOUR LIGHTS')`,
    );
    expect(outcome.ok).toBe(false);
  });
});

describe('database rules', () => {
  it('keeps at least one owner', async () => {
    const demote = await runAs(
      db,
      users.owner,
      `update public.memberships set role = 'viewer' where user_id = '${users.owner}'`,
    );
    expect(demote.ok).toBe(false);
    expect(demote.error).toMatch(/at least one owner/);

    const remove = await runAs(
      db,
      users.owner,
      `delete from public.memberships where user_id = '${users.owner}'`,
    );
    expect(remove.ok).toBe(false);
  });

  it('allows an owner to step down once another owner exists', async () => {
    await db.exec(
      `update public.memberships set role = 'owner' where user_id = '${users.producer}'`,
    );
    try {
      const outcome = await runAs(
        db,
        users.owner,
        `update public.memberships set role = 'viewer' where user_id = '${users.owner}'`,
      );
      expect(outcome.ok).toBe(true);
    } finally {
      await db.exec(
        `update public.memberships set role = 'producer' where user_id = '${users.producer}'`,
      );
    }
  });

  it('requires a department for department leads and only for them', async () => {
    await expect(
      db.exec(`
        insert into public.memberships (organization_id, user_id, role)
        values ('${orgA}', '${users.stranger}', 'department_lead')`),
    ).rejects.toThrow(/check constraint/i);
    await expect(
      db.exec(`
        insert into public.memberships (organization_id, user_id, role, department_id)
        values ('${orgA}', '${users.stranger}', 'viewer', '${ids.deptCamera}')`),
    ).rejects.toThrow(/check constraint/i);
  });

  it('rejects a block that ends before it starts', async () => {
    await expect(
      db.exec(`
        insert into public.schedule_blocks
          (organization_id, production_id, shoot_day_id, title, starts_at, ends_at)
        values ('${orgA}', '${productions.p1}', '${ids.days.d1}', 'Backwards',
          '2026-12-01T11:00:00Z', '2026-12-01T10:00:00Z')`),
    ).rejects.toThrow(/check constraint/i);
  });

  it('increments a block’s version on every update', async () => {
    await db.exec(`update public.schedule_blocks set notes = 'one' where id = '${blocks.b1}'`);
    await db.exec(`update public.schedule_blocks set notes = 'two' where id = '${blocks.b1}'`);
    const result = await db.query<{ version: number }>(
      `select version from public.schedule_blocks where id = '${blocks.b1}'`,
    );
    expect(result.rows[0]?.version).toBe(3);
    await db.exec(`update public.schedule_blocks set notes = '' where id = '${blocks.b1}'`);
  });

  it('creates a profile when a user is created', async () => {
    const result = await db.query<{ display_name: string }>(
      `select display_name from public.profiles where id = '${users.owner}'`,
    );
    expect(result.rows[0]?.display_name).toBe('Owner');
  });

  it('lets a new user create an organisation and become its owner', async () => {
    await db.exec('begin');
    try {
      await db.exec('set local role authenticated');
      await db.query(`select set_config('request.jwt.claim.sub', $1, true)`, [users.stranger]);
      await db.query(`select public.create_organization('Fresh Studio', 'fresh-studio')`);
      const memberships = await db.query<{ role: string }>(
        `select role from public.memberships where user_id = '${users.stranger}'`,
      );
      expect(memberships.rows).toEqual([{ role: 'owner' }]);
      const organizations = await db.query<{ name: string }>(
        'select name from public.organizations',
      );
      expect(organizations.rows).toEqual([{ name: 'Fresh Studio' }]);
    } finally {
      await db.exec('rollback');
    }
  });

  it('refuses organisation creation for signed-out requests', async () => {
    const outcome = await runAsAnonymous(
      db,
      `select public.create_organization('Nope', 'nope-studio')`,
    );
    expect(outcome.ok).toBe(false);
  });

  it('does not let users insert organisations directly', async () => {
    const outcome = await runAs(
      db,
      users.stranger,
      `insert into public.organizations (name, slug) values ('Direct', 'direct-studio')`,
    );
    expect(outcome.ok).toBe(false);
  });
});

describe('profiles', () => {
  it('lets people see colleagues in their organisation but nobody else', async () => {
    const seen = await runAs(db, users.owner, 'select id from public.profiles');
    const seenIds = seen.rows.map((row) => row.id);
    expect(seenIds).toContain(users.crew1);
    expect(seenIds).not.toContain(users.ownerB);
    expect(seenIds).not.toContain(users.stranger);
  });

  it('lets people edit only their own profile', async () => {
    const own = await runAs(
      db,
      users.crew1,
      `update public.profiles set display_name = 'Renamed' where id = '${users.crew1}'`,
    );
    expect(own.affected).toBe(1);
    const other = await runAs(
      db,
      users.crew1,
      `update public.profiles set display_name = 'Renamed' where id = '${users.producer}'`,
    );
    expect(other.affected).toBe(0);
  });
});
