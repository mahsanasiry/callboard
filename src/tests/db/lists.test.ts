// @vitest-environment node
import type { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ids, seed } from './fixtures';
import { createDatabase, runAs } from './harness';

const { users, orgA, deptCamera, deptSound } = ids;

let db: PGlite;

beforeAll(async () => {
  db = await createDatabase();
  await seed(db);
}, 60_000);

afterAll(async () => {
  await db.close();
});

describe('equipment', () => {
  it('starts out available', async () => {
    const result = await db.query<{ status: string }>(
      `select status from public.equipment_items where id = '${ids.equipment.camera}'`,
    );
    expect(result.rows[0]?.status).toBe('available');
  });

  it('refuses two active items with the same name, ignoring case', async () => {
    const outcome = await runAs(
      db,
      users.producer,
      `insert into public.equipment_items (organization_id, name) values ('${orgA}', 'cine camera a')`,
    );
    expect(outcome.ok).toBe(false);
    expect(outcome.error).toMatch(/duplicate key/);
  });

  it('lets an archived name be used again', async () => {
    await db.exec(
      `update public.equipment_items set deleted_at = now() where id = '${ids.equipment.camera}'`,
    );
    try {
      const outcome = await runAs(
        db,
        users.producer,
        `insert into public.equipment_items (organization_id, name) values ('${orgA}', 'Cine Camera A')`,
      );
      expect(outcome.ok).toBe(true);
    } finally {
      await db.exec(
        `update public.equipment_items set deleted_at = null where id = '${ids.equipment.camera}'`,
      );
    }
  });

  it('lets the same name exist in two organisations', async () => {
    await db.exec(
      `insert into public.equipment_items (organization_id, name) values ('${ids.orgB}', 'Cine Camera A')`,
    );
    await db.exec(
      `delete from public.equipment_items where organization_id = '${ids.orgB}' and name = 'Cine Camera A'`,
    );
  });

  it('records when an item last changed', async () => {
    const before = await db.query<{ updated_at: string }>(
      `select updated_at from public.equipment_items where id = '${ids.equipment.sound}'`,
    );
    await db.exec(`select pg_sleep(0.01)`);
    await db.exec(
      `update public.equipment_items set notes = 'checked' where id = '${ids.equipment.sound}'`,
    );
    const after = await db.query<{ updated_at: string }>(
      `select updated_at from public.equipment_items where id = '${ids.equipment.sound}'`,
    );
    expect(new Date(after.rows[0]?.updated_at ?? 0).getTime()).toBeGreaterThan(
      new Date(before.rows[0]?.updated_at ?? 0).getTime(),
    );
  });

  it('keeps leads inside their department when they change an item', async () => {
    const ownDepartment = await runAs(
      db,
      users.leadSound,
      `update public.equipment_items set status = 'maintenance' where id = '${ids.equipment.sound}'`,
    );
    const otherDepartment = await runAs(
      db,
      users.leadSound,
      `update public.equipment_items set status = 'maintenance' where id = '${ids.equipment.camera}'`,
    );
    expect(ownDepartment.affected).toBe(1);
    expect(otherDepartment.affected).toBe(0);
    expect(deptCamera).not.toBe(deptSound);
  });

  it('rejects an unknown status', async () => {
    const outcome = await runAs(
      db,
      users.producer,
      `update public.equipment_items set status = 'lost' where id = '${ids.equipment.sound}'`,
    );
    expect(outcome.ok).toBe(false);
  });
});

describe('crew members', () => {
  it('can carry notes, limited in length', async () => {
    const ok = await runAs(
      db,
      users.producer,
      `update public.crew_members set notes = 'Prefers early calls' where id = '${ids.crewMembers.free}'`,
    );
    const tooLong = await runAs(
      db,
      users.producer,
      `update public.crew_members set notes = repeat('x', 2001) where id = '${ids.crewMembers.free}'`,
    );
    expect(ok.affected).toBe(1);
    expect(tooLong.ok).toBe(false);
  });
});
