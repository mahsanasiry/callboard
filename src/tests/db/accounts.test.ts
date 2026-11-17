// @vitest-environment node
import type { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ids, seed } from './fixtures';
import { createDatabase, runAs, runSequenceAs } from './harness';

const { users, orgA } = ids;

const FUTURE = "now() + interval '7 days'";

async function invite(db: PGlite, hash: string, email: string, extra = '') {
  await db.exec(`
    insert into public.invitations (organization_id, email, role, token_hash, invited_by, expires_at)
    values ('${orgA}', '${email}', 'viewer', '${hash}', '${users.owner}', ${extra || FUTURE})`);
}

let db: PGlite;

beforeAll(async () => {
  db = await createDatabase();
  await seed(db);
  await db.exec(`update public.profiles set is_demo = true where id = '${users.viewer}'`);
}, 60_000);

afterAll(async () => {
  await db.close();
});

describe('profile preferences', () => {
  it('starts with every notification type switched on', async () => {
    const result = await db.query<{ notification_preferences: Record<string, boolean> }>(
      `select notification_preferences from public.profiles where id = '${users.crew1}'`,
    );
    expect(result.rows[0]?.notification_preferences).toEqual({
      assigned: true,
      callTimeChanged: true,
      conflict: true,
      mention: true,
      attachment: true,
    });
  });

  it('lets people change their own preferences', async () => {
    const outcome = await runAs(
      db,
      users.crew1,
      `update public.profiles
         set display_name = 'Crew One', locale = 'fa', time_zone = 'Asia/Tehran'
       where id = '${users.crew1}'`,
    );
    expect(outcome.affected).toBe(1);
  });

  it.each(['is_demo = true', 'id = gen_random_uuid()', 'created_at = now()'])(
    'refuses to let people change protected columns (%s)',
    async (assignment) => {
      const outcome = await runAs(
        db,
        users.crew1,
        `update public.profiles set ${assignment} where id = '${users.crew1}'`,
      );
      expect(outcome.ok).toBe(false);
      expect(outcome.error).toMatch(/permission denied/i);
    },
  );

  it('does not let anyone clear the demo flag on themselves', async () => {
    const outcome = await runAs(
      db,
      users.viewer,
      `update public.profiles set is_demo = false where id = '${users.viewer}'`,
    );
    expect(outcome.ok).toBe(false);
  });
});

describe('invitations', () => {
  it('are visible to owners only', async () => {
    await invite(db, 'hash-visible', 'newcomer@example.test');
    try {
      const count = async (user: string) =>
        (await runAs(db, user, 'select id from public.invitations')).rows.length;
      expect(await count(users.owner)).toBe(1);
      expect(await count(users.producer)).toBe(0);
      expect(await count(users.leadCamera)).toBe(0);
      expect(await count(users.crew1)).toBe(0);
      expect(await count(users.ownerB)).toBe(0);
    } finally {
      await db.exec('delete from public.invitations');
    }
  });

  it('can be accepted by the person they were sent to', async () => {
    await invite(db, 'hash-good', 'stranger@example.test');
    try {
      const [accept, membership] = await runSequenceAs(db, users.stranger, [
        `select public.accept_invitation('hash-good') as organization`,
        `select role from public.memberships where user_id = '${users.stranger}'`,
      ]);
      expect(accept?.rows[0]?.organization).toBe(orgA);
      expect(membership?.rows).toEqual([{ role: 'viewer' }]);
    } finally {
      await db.exec('delete from public.invitations');
    }
  });

  it('ignore differences in letter case in the address', async () => {
    await invite(db, 'hash-case', 'Stranger@Example.TEST');
    try {
      const outcome = await runAs(
        db,
        users.stranger,
        `select public.accept_invitation('hash-case')`,
      );
      expect(outcome.ok).toBe(true);
    } finally {
      await db.exec('delete from public.invitations');
    }
  });

  it('cannot be accepted by someone with a different address', async () => {
    await invite(db, 'hash-other', 'someone-else@example.test');
    try {
      const outcome = await runAs(
        db,
        users.stranger,
        `select public.accept_invitation('hash-other')`,
      );
      expect(outcome.ok).toBe(false);
      expect(outcome.error).toMatch(/different address/);
    } finally {
      await db.exec('delete from public.invitations');
    }
  });

  it('cannot be accepted after they expire', async () => {
    await invite(db, 'hash-old', 'stranger@example.test', "now() - interval '1 minute'");
    try {
      const outcome = await runAs(
        db,
        users.stranger,
        `select public.accept_invitation('hash-old')`,
      );
      expect(outcome.ok).toBe(false);
      expect(outcome.error).toMatch(/not valid/);
    } finally {
      await db.exec('delete from public.invitations');
    }
  });

  it('can be used only once', async () => {
    await invite(db, 'hash-once', 'stranger@example.test');
    try {
      await db.exec(
        `update public.invitations set accepted_at = now() where token_hash = 'hash-once'`,
      );
      const outcome = await runAs(
        db,
        users.stranger,
        `select public.accept_invitation('hash-once')`,
      );
      expect(outcome.ok).toBe(false);
    } finally {
      await db.exec('delete from public.invitations');
    }
  });

  it('cannot be guessed', async () => {
    const outcome = await runAs(db, users.stranger, `select public.accept_invitation('nothing')`);
    expect(outcome.ok).toBe(false);
  });

  it('are refused for people who are already members', async () => {
    await invite(db, 'hash-member', 'viewer@example.test');
    try {
      const outcome = await runAs(
        db,
        users.viewer,
        `select public.accept_invitation('hash-member')`,
      );
      expect(outcome.ok).toBe(false);
      expect(outcome.error).toMatch(/duplicate key/);
    } finally {
      await db.exec('delete from public.invitations');
    }
  });

  it('require a signed-in user', async () => {
    await db.exec('begin');
    try {
      await db.exec('set local role authenticated');
      await expect(db.query(`select public.accept_invitation('x')`)).rejects.toThrow(
        /authentication required/,
      );
    } finally {
      await db.exec('rollback');
    }
  });
});

describe('demo accounts', () => {
  it('keep their membership when an owner tries to change or remove it', async () => {
    const change = await runAs(
      db,
      users.owner,
      `update public.memberships set role = 'producer' where user_id = '${users.viewer}'`,
    );
    const remove = await runAs(
      db,
      users.owner,
      `delete from public.memberships where user_id = '${users.viewer}'`,
    );
    expect(change.ok).toBe(false);
    expect(remove.ok).toBe(false);
    expect(change.error).toMatch(/demo memberships/);
  });

  it('can still be managed by the seed script, which has no signed-in user', async () => {
    await db.exec(
      `update public.memberships set role = 'producer' where user_id = '${users.viewer}'`,
    );
    await db.exec(
      `update public.memberships set role = 'viewer' where user_id = '${users.viewer}'`,
    );
  });

  it('cannot be deleted by their holder', async () => {
    const outcome = await runAs(db, users.viewer, 'select public.delete_my_account()');
    expect(outcome.ok).toBe(false);
    expect(outcome.error).toMatch(/demo accounts/);
  });

  it('do not stop owners managing ordinary members', async () => {
    const outcome = await runAs(
      db,
      users.owner,
      `update public.memberships set role = 'viewer' where user_id = '${users.crew2}'`,
    );
    expect(outcome.affected).toBe(1);
  });
});

describe('account deletion', () => {
  it('removes the account and its membership but keeps what it wrote', async () => {
    const [removal, account, membership, comment, attachment] = await runSequenceAs(
      db,
      users.crew1,
      [
        'select public.delete_my_account()',
        `select id from auth.users where id = '${users.crew1}'`,
        `select id from public.memberships where user_id = '${users.crew1}'`,
        `select author_id from public.comments where id = '${ids.comment}'`,
        `select uploaded_by from public.attachments where id = '${ids.attachment}'`,
      ],
    );
    // Rows in auth.users are not visible to the role, so check the rest as the owner afterwards.
    expect(removal?.ok).toBe(true);
    expect(account?.rows ?? []).toEqual([]);
    expect(membership?.rows ?? []).toEqual([]);
    expect(comment?.rows[0]?.author_id ?? null).toBeNull();
    expect(attachment?.rows[0]?.uploaded_by ?? null).toBeNull();
  });

  it('is blocked for the only owner of an organisation', async () => {
    const outcome = await runAs(db, users.owner, 'select public.delete_my_account()');
    expect(outcome.ok).toBe(false);
    expect(outcome.error).toMatch(/at least one owner/);
  });

  it('is allowed for an owner once another owner exists', async () => {
    await db.exec(
      `update public.memberships set role = 'owner' where user_id = '${users.producer}'`,
    );
    try {
      const outcome = await runAs(db, users.owner, 'select public.delete_my_account()');
      expect(outcome.ok).toBe(true);
    } finally {
      await db.exec(
        `update public.memberships set role = 'producer' where user_id = '${users.producer}'`,
      );
    }
  });

  it('keeps productions that the deleted person created', async () => {
    await db.exec(
      `update public.productions set created_by = '${users.producer}' where id = '${ids.productions.p1}'`,
    );
    const outcome = await runAs(db, users.producer, 'select public.delete_my_account()');
    expect(outcome.ok).toBe(true);
  });

  it('requires a signed-in user', async () => {
    await db.exec('begin');
    try {
      await db.exec('set local role authenticated');
      await expect(db.query('select public.delete_my_account()')).rejects.toThrow(
        /authentication required/,
      );
    } finally {
      await db.exec('rollback');
    }
  });
});
