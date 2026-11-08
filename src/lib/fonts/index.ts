import type { FontScript } from '@/i18n/locales';

/**
 * Each script's fonts live in their own module and are imported on demand, so
 * a page in one script never preloads the fonts of another.
 */
export async function fontVariablesFor(script: FontScript): Promise<string> {
  switch (script) {
    case 'arabic':
      return (await import('./arabic')).fontVariables;
    case 'latin':
      return (await import('./latin')).fontVariables;
  }
}
