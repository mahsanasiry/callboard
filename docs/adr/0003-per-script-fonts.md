# 0003. Fonts are self-hosted and split by script

Status: accepted

## Context

The product has to read well in Latin and Arabic script now, and in more scripts later, without shipping every font to every visitor or shifting the layout when fonts arrive.

## Decision

Fonts are variable `woff2` files kept in the repository (all under the SIL Open Font License, see `docs/font-license-*.txt`) and loaded through `next/font/local`. Each script has its own module under `src/lib/fonts`, imported on demand by the layout. Only the primary interface font is preloaded. Secondary fonts are not preloaded, because Next.js collects preloads for every font in a route's module graph and an unused preload produces a console warning. Newsreader and Instrument Sans use size-adjusted fallbacks to limit layout shift.

## Consequences

A page only downloads fonts for text it actually renders. The display font in English and the Arabic-script font in Persian load slightly later than a preload would allow; `font-display: swap` keeps text visible meanwhile. Vazirmatn has no size-adjusted fallback because the adjustment is calculated from Latin metrics.
