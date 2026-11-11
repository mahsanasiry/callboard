import { describe, expect, it } from 'vitest';
import { slugBase, slugFor } from './slug';

const DATABASE_RULE = /^[a-z0-9][a-z0-9-]{1,62}$/;

describe('slugBase', () => {
  it('lowercases and joins words', () => {
    expect(slugBase('Harbour Light Films')).toBe('harbour-light-films');
  });

  it('drops accents and punctuation', () => {
    expect(slugBase('Café Noir & Co.')).toBe('cafe-noir-co');
  });

  it('falls back for names without Latin letters', () => {
    expect(slugBase('استودیو نور')).toBe('studio');
    expect(slugBase('日本')).toBe('studio');
    expect(slugBase('!')).toBe('studio');
  });

  it('limits the length without leaving a trailing dash', () => {
    const base = slugBase(`${'a'.repeat(39)} b`);
    expect(base.length).toBeLessThanOrEqual(40);
    expect(base.endsWith('-')).toBe(false);
  });
});

describe('slugFor', () => {
  it.each(['Harbour Light Films', 'استودیو', 'x', '  --  ', 'A'.repeat(200)])(
    'always satisfies the database rule for %j',
    (name) => {
      expect(slugFor(name, 'a1b2')).toMatch(DATABASE_RULE);
    },
  );
});
