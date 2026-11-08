import { runInThisContext } from 'node:vm';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { themeInitScript } from './init-script';
import {
  DEFAULT_PREFERENCES,
  THEME_STORAGE_KEY,
  parsePreferences,
  resolvePreferences,
  type ThemePreferences,
} from './preferences';

const lightSystem = { prefersDark: false, prefersReducedMotion: false };
const darkReducedSystem = { prefersDark: true, prefersReducedMotion: true };

describe('parsePreferences', () => {
  it('falls back to defaults for missing, malformed or unknown input', () => {
    expect(parsePreferences(null)).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences('not json')).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences('42')).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences('{"mode":"sepia","accent":"pink"}')).toEqual(DEFAULT_PREFERENCES);
  });

  it('keeps valid values and replaces only the invalid ones', () => {
    const parsed = parsePreferences('{"mode":"dark","accent":"nope","density":"compact"}');
    expect(parsed).toEqual({ ...DEFAULT_PREFERENCES, mode: 'dark', density: 'compact' });
  });
});

describe('resolvePreferences', () => {
  it('follows the system when asked to', () => {
    expect(resolvePreferences(DEFAULT_PREFERENCES, darkReducedSystem)).toMatchObject({
      theme: 'dark',
      motion: 'reduce',
    });
    expect(resolvePreferences(DEFAULT_PREFERENCES, lightSystem)).toMatchObject({
      theme: 'light',
      motion: 'full',
    });
  });

  it('lets an explicit choice override the system', () => {
    const preferences: ThemePreferences = { ...DEFAULT_PREFERENCES, mode: 'light', motion: 'full' };
    expect(resolvePreferences(preferences, darkReducedSystem)).toMatchObject({
      theme: 'light',
      motion: 'full',
    });
  });
});

describe('themeInitScript', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function runScript(stored: string | null, system: typeof lightSystem) {
    localStorage.clear();
    if (stored !== null) localStorage.setItem(THEME_STORAGE_KEY, stored);
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('dark') ? system.prefersDark : system.prefersReducedMotion,
    }));
    runInThisContext(themeInitScript);
    const { theme, accent, density, motion } = document.documentElement.dataset;
    return { theme, accent, density, motion };
  }

  it.each([
    [null, lightSystem],
    [null, darkReducedSystem],
    ['{"mode":"dark","accent":"rose","density":"compact","motion":"full"}', lightSystem],
    ['{"mode":"light","motion":"reduce"}', darkReducedSystem],
    ['{broken', darkReducedSystem],
  ])('matches resolvePreferences for %s', (stored, system) => {
    const expected = resolvePreferences(parsePreferences(stored), system);
    expect(runScript(stored, system)).toEqual(expected);
  });
});
