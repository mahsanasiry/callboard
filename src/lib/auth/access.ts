import { locales, type Locale } from '@/i18n/locales';

/** Paths, without the locale prefix, that need a signed-in user. */
export const PROTECTED_PREFIXES = ['/dashboard'] as const;

/** Paths that only make sense when signed out. */
export const GUEST_ONLY_PATHS = ['/login', '/signup', '/forgot-password'] as const;

export const DEFAULT_SIGNED_IN_PATH = '/dashboard';

export interface SplitPath {
  readonly locale: Locale | null;
  readonly path: string;
}

export function splitLocale(pathname: string): SplitPath {
  const [, first = '', ...rest] = pathname.split('/');
  const locale = locales.find((candidate) => candidate === first) ?? null;
  if (!locale) return { locale: null, path: pathname || '/' };
  return { locale, path: `/${rest.join('/')}`.replace(/\/+$/, '') || '/' };
}

function startsWithSegment(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}/`);
}

export type AccessDecision =
  { readonly kind: 'allow' } | { readonly kind: 'redirect'; readonly path: string };

export function decideAccess(path: string, isSignedIn: boolean): AccessDecision {
  if (!isSignedIn && PROTECTED_PREFIXES.some((prefix) => startsWithSegment(path, prefix))) {
    return { kind: 'redirect', path: `/login?next=${encodeURIComponent(path)}` };
  }
  if (isSignedIn && GUEST_ONLY_PATHS.some((guestPath) => startsWithSegment(path, guestPath))) {
    return { kind: 'redirect', path: DEFAULT_SIGNED_IN_PATH };
  }
  return { kind: 'allow' };
}

/**
 * Only same-site paths are accepted as a post-login destination, so a crafted
 * link cannot send someone to another site after they sign in.
 */
export function safeNextPath(candidate: string | null | undefined): string | null {
  if (!candidate) return null;
  if (!candidate.startsWith('/') || candidate.startsWith('//') || candidate.includes('\\')) {
    return null;
  }
  if (Array.from(candidate).some((character) => character.charCodeAt(0) < 32)) return null;
  const { path } = splitLocale(candidate);
  return path.startsWith('/') ? path : null;
}
