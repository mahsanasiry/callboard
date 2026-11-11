# Callboard

A production-planning workspace for small film, event and photo-shoot crews. A producer plans shoot days, schedules scenes, assigns crew and equipment, and keeps everyone aligned on call times, including on location with poor connectivity.

> Screenshots and a live demo link will go here once the product screens exist.

## Status

This repository is built in phases. Done so far:

- Foundation: Next.js App Router, strict TypeScript, Tailwind driven by design tokens, themes, locale routing for English and Persian with right-to-left layout, and a design-system page at `/en/design`
- Database: schema, row level security and migrations for organisations, members, productions, shoot days, schedule blocks, locations, crew, equipment, comments and attachments
- Permissions: one typed policy module shared by the database tests, the server and the interface, with a generated role matrix
- Authentication: sign up, sign in, sign out, password reset and email confirmation, protected routes, and one-click demo accounts for each role
- Application shell: a signed-in dashboard that shows the person's organisation, role, the productions they can see, and what the role may do, read from the same policy the database is tested against
- Quality gates: lint, logical-property check, locale completeness check, unit tests, database tests and a CI workflow

Not built yet: profile and member management, the remaining application screens, the schedule timeline, real-time updates, offline support, the remaining twenty languages, end-to-end tests. They are in the roadmap and nothing in this README claims them.

## Requirements

- Node.js 22 or newer
- pnpm 11

## Getting started

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000. Copy `.env.example` to `.env.local` if you need to change the site URL.

## Scripts

| Command             | What it does                                                                    |
| ------------------- | ------------------------------------------------------------------------------- |
| `pnpm dev`          | Start the development server                                                    |
| `pnpm build`        | Production build                                                                |
| `pnpm lint`         | ESLint with type-aware strict rules and accessibility rules, zero warnings      |
| `pnpm lint:logical` | Fails on physical direction styles (left, right) that would break right-to-left |
| `pnpm typecheck`    | TypeScript in strict mode                                                       |
| `pnpm i18n:check`   | Every locale has every key, valid ICU syntax, matching placeholders and plurals |
| `pnpm test`         | Unit and component tests                                                        |
| `pnpm verify`       | All of the above plus a build, the same sequence CI runs                        |

## Setting up Supabase

1. Create a project and copy its URL and publishable key into `.env.local` (see `.env.example`).
2. Apply the migration (see Database below).
3. In Authentication > URL Configuration, set the Site URL to your site (`http://localhost:3000` while developing) and add `http://localhost:3000/**` and your deployed address to the redirect URLs.
4. Email links work with Supabase's own templates. They return to `/auth/confirm` with a one-time code, which the app exchanges for a session; the link must be opened in the same browser that requested it. If you configure custom SMTP you may also edit the templates to link to `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup` (and `type=recovery&next=/reset-password` for password reset), which works across browsers.
5. Supabase's built-in email sender is rate limited and only delivers to members of your project's organisation. For local testing switch off "Confirm email" under Authentication > Sign In / Providers > Email, and for a public deployment configure your own SMTP provider.

### Demo accounts

Set `DEMO_EMAIL_TEMPLATE`, `DEMO_ACCOUNT_PASSWORD` and, temporarily, `SUPABASE_SECRET_KEY` in `.env.local`, then run `pnpm seed:demo`. It creates the demo organisation, one confirmed account per role and two productions, and can be run again safely. The sign-in buttons on the login page appear only when the first two variables are set. The secret key is used by the seed script alone and must never be set on the deployed site.

## Database

The migrations in `supabase/migrations` are plain SQL and run unchanged on Supabase. The data model is described in [`docs/data-model.md`](docs/data-model.md) and the role matrix in [`docs/rbac-matrix.md`](docs/rbac-matrix.md).

`pnpm test` also runs the database suite. It loads the migrations into an in-process Postgres (PGlite), so no Docker or local database is needed. The suite proves that every table has row level security, that organisations and roles cannot see each other's data, and that the database allows exactly what the shared policy says it should.

To apply the migrations to a Supabase project, open the SQL editor, paste the contents of each file in `supabase/migrations` in filename order and run it.

## Decisions

Short records live in [`docs/adr`](docs/adr). The translation glossary is in [`docs/translation-glossary.md`](docs/translation-glossary.md).

## Languages

| Language | Direction | Verified by a native speaker |
| -------- | --------- | ---------------------------- |
| English  | LTR       | Source language              |
| Persian  | RTL       | No                           |

Translations must be reviewed by native speakers before real production use.

## Roadmap

1. Database schema, row-level security and the shared permissions module
2. Authentication and demo accounts for each role
3. Productions, shoot days, locations, crew and equipment
4. The schedule timeline with drag and drop and conflict detection
5. Dashboard, search, filters, bulk actions and undo
6. Real-time updates, notifications and activity history
7. Offline support
8. The remaining languages
9. End-to-end tests, performance and accessibility audits, deployment

## Fonts

Instrument Sans, Newsreader and Vazirmatn, all under the SIL Open Font License. Licence texts are in `docs`.
