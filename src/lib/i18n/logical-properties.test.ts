import { describe, expect, it } from 'vitest';
import { findPhysicalProperties } from './logical-properties';

describe('findPhysicalProperties', () => {
  it('flags physical Tailwind utilities, including variants and negatives', () => {
    const source = '<div className="ml-2 md:pr-4 -mr-1 text-left rounded-tl-lg border-r" />';
    const matches = findPhysicalProperties(source, 'a.tsx').map((violation) => violation.match);
    expect(matches).toEqual(['ml-2', 'pr-4', '-mr-1', 'text-left', 'rounded-tl-lg', 'border-r']);
  });

  it('allows logical utilities', () => {
    const source =
      '<div className="ms-2 pe-4 text-start rounded-s-lg border-e inset-s-0 start-1/2" />';
    expect(findPhysicalProperties(source, 'a.tsx')).toEqual([]);
  });

  it('does not match unrelated words', () => {
    const source = 'const primary = "pr"; const mlx = 1; // apply-left';
    expect(findPhysicalProperties(source, 'a.ts')).toEqual([]);
  });

  it('flags physical CSS declarations and accepts logical ones', () => {
    const css =
      '.a { margin-left: 1px; text-align: right; left: 0; }\n.b { margin-inline-start: 1px; }';
    const found = findPhysicalProperties(css, 'a.css');
    expect(found.map((violation) => violation.line)).toEqual([1, 1, 1]);
  });
});
