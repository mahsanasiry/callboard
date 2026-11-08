# 0001. Toolchain versions

Status: accepted

## Context

The brief asks for the latest stable versions of everything. "Latest" and "compatible" are not always the same release. When this project was set up, TypeScript 7 and ESLint 10 were the newest stable releases, but the lint tooling the project depends on did not support them yet:

- `typescript-eslint` declares support for TypeScript below 6.1.
- `eslint-plugin-jsx-a11y` declares support for ESLint up to 9.

## Decision

Use TypeScript 6.0 and ESLint 9, the newest releases that the rest of the toolchain supports. Everything else (Next.js, React, Tailwind, next-intl, Vitest) is on its latest stable release.

## Consequences

Strict type-aware linting and accessibility linting keep working. Upgrading either tool is a small change once the plugins publish support: bump the version, run `pnpm verify`.
