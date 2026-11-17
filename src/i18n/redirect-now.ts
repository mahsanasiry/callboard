import type { Locale } from './locales';
import { redirect } from './navigation';

/** `redirect` throws to navigate; this gives the compiler the same guarantee. */
export function redirectNow(href: string, locale: Locale): never {
  redirect({ href, locale });
  throw new Error('redirect did not navigate');
}
