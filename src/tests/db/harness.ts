import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';

const root = process.cwd();

export async function createDatabase(): Promise<PGlite> {
  const db = new PGlite();
  await db.exec(readFileSync(join(root, 'src/tests/db/auth-stub.sql'), 'utf8'));

  const migrationsDirectory = join(root, 'supabase/migrations');
  const migrations = readdirSync(migrationsDirectory)
    .filter((file) => file.endsWith('.sql'))
    .sort();
  for (const file of migrations) {
    await db.exec(readFileSync(join(migrationsDirectory, file), 'utf8'));
  }
  return db;
}

export interface Outcome {
  readonly ok: boolean;
  readonly rows: Record<string, unknown>[];
  readonly affected: number;
  readonly error: string | null;
}

/**
 * Runs one statement as an authenticated user inside a transaction that is
 * always rolled back, so scenarios never affect each other.
 */
export async function runAs(
  db: PGlite,
  userId: string | null,
  sql: string,
  params: unknown[] = [],
): Promise<Outcome> {
  await db.exec('begin');
  try {
    await db.exec('set local role authenticated');
    if (userId !== null) {
      await db.query(`select set_config('request.jwt.claim.sub', $1, true)`, [userId]);
    }
    const result = await db.query<Record<string, unknown>>(sql, params);
    return {
      ok: true,
      rows: result.rows,
      affected: Math.max(result.affectedRows ?? 0, result.rows.length),
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      rows: [],
      affected: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    await db.exec('rollback');
  }
}

export async function runAsAnonymous(db: PGlite, sql: string): Promise<Outcome> {
  await db.exec('begin');
  try {
    await db.exec('set local role anon');
    const result = await db.query<Record<string, unknown>>(sql);
    return { ok: true, rows: result.rows, affected: result.rows.length, error: null };
  } catch (error) {
    return {
      ok: false,
      rows: [],
      affected: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    await db.exec('rollback');
  }
}

/** Runs several statements as one user in a single transaction that is rolled back at the end. */
export async function runSequenceAs(
  db: PGlite,
  userId: string | null,
  statements: readonly string[],
): Promise<Outcome[]> {
  const outcomes: Outcome[] = [];
  await db.exec('begin');
  try {
    await db.exec('set local role authenticated');
    if (userId !== null) {
      await db.query(`select set_config('request.jwt.claim.sub', $1, true)`, [userId]);
    }
    for (const statement of statements) {
      try {
        const result = await db.query<Record<string, unknown>>(statement);
        outcomes.push({
          ok: true,
          rows: result.rows,
          affected: Math.max(result.affectedRows ?? 0, result.rows.length),
          error: null,
        });
      } catch (error) {
        outcomes.push({
          ok: false,
          rows: [],
          affected: 0,
          error: error instanceof Error ? error.message : String(error),
        });
        // A failed statement aborts the transaction; later statements would all fail.
        break;
      }
    }
  } finally {
    await db.exec('rollback');
  }
  return outcomes;
}
