import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LOCALES } from '@/i18n/locales';
import { checkMessages, type MessageTree } from './check-messages';

function run(source: MessageTree, target: MessageTree, locale = 'de') {
  return checkMessages({ source: 'en', catalogs: { en: source, [locale]: target } });
}

describe('checkMessages', () => {
  it('accepts a complete catalog', () => {
    expect(run({ Title: 'Hello {name}' }, { Title: 'Hallo {name}' })).toEqual([]);
  });

  it('reports missing and extra keys', () => {
    const issues = run({ A: 'a', B: 'b' }, { A: 'a', C: 'c' });
    expect(issues.map((issue) => [issue.key, issue.code])).toEqual([
      ['B', 'missing'],
      ['C', 'extra'],
    ]);
  });

  it('reports empty messages', () => {
    expect(run({ A: 'a' }, { A: '  ' })[0]?.code).toBe('empty');
  });

  it('reports ICU syntax errors', () => {
    expect(run({ A: 'a' }, { A: 'Hello {name' })[0]?.code).toBe('syntax');
  });

  it('reports a placeholder that was renamed or dropped', () => {
    const issues = run({ A: 'Hi {name}' }, { A: 'Hi {nom}' });
    expect(issues[0]?.code).toBe('placeholders');
  });

  it('requires every plural category of the target language', () => {
    const source = { Count: '{count, plural, one {# day} other {# days}}' };
    const russianIncomplete = { Count: '{count, plural, one {# день} other {# дня}}' };
    const russianComplete = {
      Count: '{count, plural, one {# день} few {# дня} many {# дней} other {# дня}}',
    };

    expect(run(source, russianIncomplete, 'ru').map((issue) => issue.code)).toEqual([
      'plural-category',
    ]);
    expect(run(source, russianComplete, 'ru')).toEqual([]);
  });

  it('requires an other clause', () => {
    expect(run({ A: 'a' }, { A: '{n, plural, one {x}}' })[0]?.code).toBe('syntax');
  });

  it('compares nested keys by path', () => {
    const issues = run({ Group: { Inner: 'x' } }, { Group: {} });
    expect(issues[0]).toMatchObject({ key: 'Group.Inner', code: 'missing' });
  });
});

describe('shipped catalogs', () => {
  it('have no issues', () => {
    const catalogs = Object.fromEntries(
      Object.keys(LOCALES).map((locale) => [
        locale,
        JSON.parse(
          readFileSync(join(process.cwd(), 'messages', `${locale}.json`), 'utf8'),
        ) as MessageTree,
      ]),
    );
    expect(checkMessages({ source: 'en', catalogs })).toEqual([]);
  });
});
