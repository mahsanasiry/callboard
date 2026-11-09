# 0004. One permission policy, checked against the database

Status: accepted

## Context

Access rules have to hold in three places: the database, the server code that runs mutations, and the interface that hides or disables actions. Written three times by hand they drift apart, and the first sign is usually a user who can do something they should not, or a button that does nothing.

Postgres row level security cannot import TypeScript, so the rules cannot literally be shared with the database.

## Decision

The rules live in one typed module, `src/lib/permissions/policy.ts`, as a table of grants per role. A grant is either unconditional or narrowed by conditions (own department, assigned productions, own records). The server and the interface call `can()` and get back an allowed or denied result with a reason the interface can explain to the person.

The database policies are written separately in SQL, and a test keeps the two honest. `src/tests/db/rls-matrix.test.ts` loads the real migrations into an in-process Postgres, seeds a small organisation with one user per role, and for every permission scenario runs the actual statement as each user. It then asserts that the database allowed it exactly when `can()` says it should. A change to either side that is not mirrored on the other fails the test.

`docs/rbac-matrix.md` is generated from the same table, and a test fails if it is out of date.

## Consequences

Adding a permission means editing the policy, the SQL and the scenario list, and the suite points at whichever one was forgotten. The tests use PGlite, so they need no Docker or local Postgres and run the same on Windows, in CI and in a clone. PGlite is not Supabase: it does not exercise PostgREST, Storage policies or the real JWT plumbing, which is why the harness stubs `auth.uid()` and the roles, and why those parts are covered separately.

Soft-deleted blocks and attachments stay visible to the people who may edit them. Without that, the update that sets `deleted_at` fails its own visibility check, because Postgres applies select policies to the new row of an update.
