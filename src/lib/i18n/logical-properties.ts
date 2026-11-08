export interface Violation {
  readonly line: number;
  readonly match: string;
}

const PHYSICAL_UTILITY =
  /(?<![\w-])-?(?:(?:m[lr]|p[lr]|scroll-m[lr]|scroll-p[lr])-|border-[lr](?:-|(?![\w-]))|rounded-(?:[lr]|[tb][lr])(?:-|(?![\w-]))|(?:text|float|clear)-(?:left|right)(?![\w-])|(?:left|right)-)[\w./[\]()%-]*/g;

const PHYSICAL_DECLARATION =
  /\b(?:margin|padding|border|scroll-margin|scroll-padding)-(?:left|right)\b|(?<![\w-])(?:left|right)\s*:|text-align\s*:\s*(?:left|right)|float\s*:\s*(?:left|right)/g;

export function findPhysicalProperties(source: string, filename: string): Violation[] {
  const pattern = filename.endsWith('.css') ? PHYSICAL_DECLARATION : PHYSICAL_UTILITY;
  const violations: Violation[] = [];

  source.split('\n').forEach((text, index) => {
    for (const match of text.matchAll(pattern)) {
      violations.push({ line: index + 1, match: match[0].trim() });
    }
  });

  return violations;
}
