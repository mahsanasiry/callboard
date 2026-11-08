export type TextDirection = 'ltr' | 'rtl';
export type FontScript = 'latin' | 'arabic';

export interface LocaleDefinition {
  readonly nativeName: string;
  readonly direction: TextDirection;
  readonly script: FontScript;
}

/**
 * The single place where a language is registered. Adding a language means
 * adding its entry here and its file under messages/.
 */
export const LOCALES = {
  en: { nativeName: 'English', direction: 'ltr', script: 'latin' },
  fa: { nativeName: 'فارسی', direction: 'rtl', script: 'arabic' },
} as const satisfies Record<string, LocaleDefinition>;

export type Locale = keyof typeof LOCALES;

export const locales = Object.keys(LOCALES) as Locale[];
export const defaultLocale: Locale = 'en';

export function isLocale(value: string | undefined): value is Locale {
  return value !== undefined && Object.hasOwn(LOCALES, value);
}
