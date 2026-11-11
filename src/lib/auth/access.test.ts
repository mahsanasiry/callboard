import { describe, expect, it } from 'vitest';
import { decideAccess, safeNextPath, splitLocale } from './access';

describe('splitLocale', () => {
  it('separates a known locale prefix', () => {
    expect(splitLocale('/fa/dashboard')).toEqual({ locale: 'fa', path: '/dashboard' });
    expect(splitLocale('/en')).toEqual({ locale: 'en', path: '/' });
    expect(splitLocale('/en/')).toEqual({ locale: 'en', path: '/' });
  });

  it('leaves paths without a known locale alone', () => {
    expect(splitLocale('/dashboard')).toEqual({ locale: null, path: '/dashboard' });
    expect(splitLocale('/xx/dashboard')).toEqual({ locale: null, path: '/xx/dashboard' });
  });
});

describe('decideAccess', () => {
  it('sends signed-out visitors from protected pages to the login page and remembers where they were going', () => {
    expect(decideAccess('/dashboard', false)).toEqual({
      kind: 'redirect',
      path: '/login?next=%2Fdashboard',
    });
    expect(decideAccess('/dashboard/anything', false)).toEqual({
      kind: 'redirect',
      path: '/login?next=%2Fdashboard%2Fanything',
    });
  });

  it('does not treat lookalike paths as protected', () => {
    expect(decideAccess('/dashboards-are-nice', false)).toEqual({ kind: 'allow' });
  });

  it('keeps public pages open', () => {
    for (const path of ['/', '/design', '/login', '/signup', '/forgot-password']) {
      expect(decideAccess(path, false)).toEqual({ kind: 'allow' });
    }
  });

  it('moves signed-in users off the guest pages', () => {
    for (const path of ['/login', '/signup', '/forgot-password']) {
      expect(decideAccess(path, true)).toEqual({ kind: 'redirect', path: '/dashboard' });
    }
  });

  it('lets signed-in users reach protected and public pages', () => {
    expect(decideAccess('/dashboard', true)).toEqual({ kind: 'allow' });
    expect(decideAccess('/design', true)).toEqual({ kind: 'allow' });
  });

  it('keeps the password reset page reachable while signed in', () => {
    expect(decideAccess('/reset-password', true)).toEqual({ kind: 'allow' });
  });
});

describe('safeNextPath', () => {
  it('accepts same-site paths and drops the locale prefix', () => {
    expect(safeNextPath('/dashboard')).toBe('/dashboard');
    expect(safeNextPath('/fa/dashboard')).toBe('/dashboard');
    expect(safeNextPath('/dashboard?tab=today')).toBe('/dashboard?tab=today');
  });

  it.each([
    'https://evil.example',
    '//evil.example',
    '/\\evil.example',
    'javascript:alert(1)',
    'dashboard',
    '/ok\nsplit',
    '',
  ])('rejects %j', (candidate) => {
    expect(safeNextPath(candidate)).toBeNull();
  });

  it('rejects missing values', () => {
    expect(safeNextPath(null)).toBeNull();
    expect(safeNextPath(undefined)).toBeNull();
  });
});
