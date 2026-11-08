# Callboard

A production-planning workspace for small film, event and photo-shoot crews. A producer plans shoot days, schedules scenes, assigns crew and equipment, and keeps everyone aligned on call times, including on location with poor connectivity.

> Screenshots and a live demo link will go here once the product screens exist.

## Status

This repository is built in phases. Right now only the foundation is in place:

- Next.js App Router, React and strict TypeScript, with Tailwind driven by design tokens
- Light and dark themes, five accent colours, two densities and a reduced-motion option, applied before first paint
- Locale routing with English and Persian, right-to-left layout through logical properties, and typed message keys
- A design-system page at `/en/design` that shows the tokens in the active theme
- A locale completeness check, a logical-property check, unit tests and a CI workflow

Not built yet: authentication, the database, the schedule, offline support, the remaining twenty languages, end-to-end tests. They are listed in the roadmap and nothing in this README claims them.

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
