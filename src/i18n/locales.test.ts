import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LOCALES, defaultLocale, isLocale, locales } from './locales';

describe('locale registry', () => {
  it('registers the default locale', () => {
    expect(locales).toContain(defaultLocale);
  });

  it('has a message file for every registered locale and no others', () => {
    const files = readdirSync(join(process.cwd(), 'messages'))
      .filter((file) => file.endsWith('.json'))
      .map((file) => file.replace('.json', ''))
      .sort();
    expect(files).toEqual([...locales].sort());
  });

  it('marks right-to-left languages', () => {
    expect(LOCALES.fa.direction).toBe('rtl');
    expect(LOCALES.en.direction).toBe('ltr');
  });

  it('narrows unknown values', () => {
    expect(isLocale('fa')).toBe(true);
    expect(isLocale('xx')).toBe(false);
    expect(isLocale('toString')).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });
});
