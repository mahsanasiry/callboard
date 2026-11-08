# 0002. Reading the locale from root params

Status: accepted

## Context

next-intl's `setRequestLocale` had to be called in every layout and page to keep pages static, and forgetting it silently made a page dynamic. It is now marked deprecated in favour of `next/root-params`, which Next.js provides from 16.3.

## Decision

`src/i18n/request.ts` reads the locale with `next/root-params`. Pages do not forward the locale to next-intl themselves. The `[locale]` layout is the root layout, which root params require.

## Consequences

Static rendering works without per-page ceremony. Root params are not available in route handlers or server actions, so code running there must pass the locale explicitly (for example `getTranslations({ locale })`) when it needs translated text, such as validation messages.
