import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { decideAccess, splitLocale } from '@/lib/auth/access';
import { readSupabaseEnv } from '@/lib/supabase/env';
import { routing } from './i18n/routing';

const handleLocale = createIntlMiddleware(routing);

export default async function proxy(request: NextRequest) {
  const response = handleLocale(request);

  const env = readSupabaseEnv();
  if (!env) return response;

  const supabase = createServerClient(env.url, env.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Verifies the token signature and refreshes it when it is close to expiring.
  const { data } = await supabase.auth.getClaims();

  const { locale, path } = splitLocale(request.nextUrl.pathname);
  if (!locale) return response;

  const decision = decideAccess(path, Boolean(data?.claims));
  if (decision.kind === 'allow') return response;

  const redirect = NextResponse.redirect(new URL(`/${locale}${decision.path}`, request.url));
  for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
  return redirect;
}

export const config = {
  matcher: ['/((?!api|auth|_next|_vercel|.*\\..*).*)'],
};
