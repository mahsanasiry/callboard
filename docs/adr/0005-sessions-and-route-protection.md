# 0005. Sessions and route protection

Status: accepted

## Context

Signed-in state has to be known in three places: the proxy that guards routes, the server components that render the signed-in pages, and server actions that change data. Cookies written by the browser can be forged, and a page that trusts them will show the wrong person's data.

## Decision

Sessions live in cookies managed by `@supabase/ssr`, and every server-side read goes through Supabase rather than trusting the cookie contents.

- The proxy (`src/proxy.ts`) runs the locale middleware first, then verifies the access token's signature with `getClaims()`, which also refreshes a token that is close to expiring and writes the new cookies onto the response. It then asks `decideAccess()` whether the path needs a session. That function is pure and tested; the proxy only applies its answer.
- Server components and actions call `getUser()`, which asks the auth server, before they read data. Row level security then limits what that user can read, so a bypassed redirect still returns nothing.
- The post-login destination comes from a `next` parameter that `safeNextPath()` reduces to a same-site path, so a crafted link cannot send someone elsewhere.
- Email links (confirmation, password reset) point at `/auth/confirm`, which sits outside the locale routing so the link in a template does not depend on the visitor's language. It exchanges the one-time token for a session and then redirects into the right locale.
- Sign-up and password reset answer identically whether or not an address already has an account, so the forms cannot be used to find out who is registered.

## Consequences

The proxy never throws when Supabase is not configured: public pages keep working and the protected ones fail closed. Pages under `(app)` are rendered per request, since they depend on the person. Moving the guard into the proxy keeps a signed-out visitor from ever reaching a protected component, and the second check inside the page means a mistake in the proxy matcher does not expose data.
