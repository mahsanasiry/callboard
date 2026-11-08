import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ACCENTS } from './preferences';
import { contrastRatio } from './contrast';

const css = readFileSync(join(process.cwd(), 'src/styles/tokens.css'), 'utf8').replace(
  /\/\*[\s\S]*?\*\//g,
  '',
);

interface Block {
  selectors: string[];
  declarations: Map<string, string>;
}

function parseBlocks(source: string): Block[] {
  const blocks: Block[] = [];
  for (const match of source.matchAll(/([^{}@]+)\{([^{}]*)\}/g)) {
    const selectors = (match[1] ?? '').split(',').map((selector) => selector.trim());
    const declarations = new Map<string, string>();
    for (const declaration of (match[2] ?? '').split(';')) {
      const [name, ...rest] = declaration.split(':');
      if (name && rest.length > 0) declarations.set(name.trim(), rest.join(':').trim());
    }
    blocks.push({ selectors, declarations });
  }
  return blocks;
}

const blocks = parseBlocks(css);

function tokensFor(...selectors: string[]): Map<string, string> {
  const merged = new Map<string, string>();
  for (const selector of selectors) {
    const block = blocks.find((candidate) => candidate.selectors.includes(selector));
    if (!block) throw new Error(`No token block for ${selector}`);
    for (const [name, value] of block.declarations) merged.set(name, value);
  }
  return merged;
}

function themeTokens(theme: 'light' | 'dark', accent: string): Map<string, string> {
  const base = tokensFor(`:root[data-theme='${theme}']`);
  const accentTokens =
    theme === 'light'
      ? tokensFor(`:root[data-accent='${accent}']`)
      : tokensFor(`:root[data-theme='dark'][data-accent='${accent}']`);
  return new Map([...base, ...accentTokens]);
}

function color(tokens: Map<string, string>, name: string): string {
  const value = tokens.get(`--ds-${name}`);
  if (!value) throw new Error(`Missing token --ds-${name}`);
  return value;
}

const TEXT_PAIRS = [
  ['ink', 'canvas'],
  ['ink', 'surface'],
  ['ink', 'sunken'],
  ['ink-muted', 'canvas'],
  ['ink-muted', 'surface'],
  ['ink-muted', 'sunken'],
  ['ink-subtle', 'canvas'],
  ['ink-subtle', 'surface'],
  ['ink-subtle', 'sunken'],
  ['danger', 'surface'],
  ['danger', 'canvas'],
  ['warning', 'surface'],
  ['success', 'surface'],
] as const;

describe.each(['light', 'dark'] as const)('%s theme contrast', (theme) => {
  const tokens = themeTokens(theme, 'cobalt');

  it.each(TEXT_PAIRS)('%s on %s meets 4.5:1', (foreground, background) => {
    expect(
      contrastRatio(color(tokens, foreground), color(tokens, background)),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it.each(ACCENTS)(
    'accent %s: text on accent meets 4.5:1 and accent stands out at 3:1',
    (accent) => {
      const accentTokens = themeTokens(theme, accent);
      expect(
        contrastRatio(color(accentTokens, 'accent-fg'), color(accentTokens, 'accent')),
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        contrastRatio(color(accentTokens, 'accent'), color(accentTokens, 'surface')),
      ).toBeGreaterThanOrEqual(3);
      expect(
        contrastRatio(color(accentTokens, 'accent'), color(accentTokens, 'canvas')),
      ).toBeGreaterThanOrEqual(3);
    },
  );
});
