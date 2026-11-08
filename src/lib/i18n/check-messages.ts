import { parse, TYPE, type MessageFormatElement } from '@formatjs/icu-messageformat-parser';

export type MessageTree = { readonly [key: string]: string | MessageTree };

export type IssueCode =
  'missing' | 'extra' | 'empty' | 'not-a-string' | 'syntax' | 'placeholders' | 'plural-category';

export interface Issue {
  readonly locale: string;
  readonly key: string;
  readonly code: IssueCode;
  readonly detail: string;
}

export interface CheckInput {
  readonly source: string;
  readonly catalogs: Readonly<Record<string, MessageTree>>;
}

type FlatCatalog = Map<string, unknown>;

function flatten(tree: MessageTree, prefix = '', into: FlatCatalog = new Map()): FlatCatalog {
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object') {
      flatten(value, path, into);
    } else {
      into.set(path, value);
    }
  }
  return into;
}

interface Signature {
  readonly names: string[];
  readonly pluralArguments: { name: string; categories: string[] }[];
}

function collect(elements: MessageFormatElement[], signature: Signature): void {
  for (const element of elements) {
    switch (element.type) {
      case TYPE.argument:
      case TYPE.number:
      case TYPE.date:
      case TYPE.time:
        signature.names.push(element.value);
        break;
      case TYPE.select:
        signature.names.push(element.value);
        for (const option of Object.values(element.options)) collect(option.value, signature);
        break;
      case TYPE.plural:
        signature.names.push(element.value);
        signature.pluralArguments.push({
          name: element.value,
          categories: Object.keys(element.options).filter((option) => !option.startsWith('=')),
        });
        for (const option of Object.values(element.options)) collect(option.value, signature);
        break;
      case TYPE.tag:
        signature.names.push(`<${element.value}>`);
        collect(element.children, signature);
        break;
      case TYPE.literal:
      case TYPE.pound:
        break;
    }
  }
}

function describe(message: string): Signature {
  const signature: Signature = { names: [], pluralArguments: [] };
  collect(parse(message, { requiresOtherClause: true }), signature);
  signature.names.sort();
  return signature;
}

function pluralCategoriesFor(locale: string): string[] {
  return new Intl.PluralRules(locale).resolvedOptions().pluralCategories;
}

export function checkMessages({ source, catalogs }: CheckInput): Issue[] {
  const issues: Issue[] = [];
  const sourceTree = catalogs[source];
  if (!sourceTree) {
    return [{ locale: source, key: '', code: 'missing', detail: 'source catalog not found' }];
  }

  const sourceCatalog = flatten(sourceTree);
  const sourceSignatures = new Map<string, Signature>();

  for (const [key, value] of sourceCatalog) {
    if (typeof value !== 'string' || value.trim() === '') {
      issues.push({ locale: source, key, code: 'empty', detail: 'source message is empty' });
      continue;
    }
    try {
      sourceSignatures.set(key, describe(value));
    } catch (error) {
      issues.push({ locale: source, key, code: 'syntax', detail: errorMessage(error) });
    }
  }

  for (const [locale, tree] of Object.entries(catalogs)) {
    if (locale === source) continue;
    const catalog = flatten(tree);
    const required = pluralCategoriesFor(locale);

    for (const key of sourceCatalog.keys()) {
      if (!catalog.has(key)) {
        issues.push({ locale, key, code: 'missing', detail: 'key is not translated' });
      }
    }

    for (const [key, value] of catalog) {
      if (!sourceCatalog.has(key)) {
        issues.push({ locale, key, code: 'extra', detail: 'key does not exist in the source' });
        continue;
      }
      if (typeof value !== 'string') {
        issues.push({ locale, key, code: 'not-a-string', detail: 'message must be a string' });
        continue;
      }
      if (value.trim() === '') {
        issues.push({ locale, key, code: 'empty', detail: 'message is empty' });
        continue;
      }

      let signature: Signature;
      try {
        signature = describe(value);
      } catch (error) {
        issues.push({ locale, key, code: 'syntax', detail: errorMessage(error) });
        continue;
      }

      const expected = sourceSignatures.get(key);
      if (expected && expected.names.join('|') !== signature.names.join('|')) {
        issues.push({
          locale,
          key,
          code: 'placeholders',
          detail: `expected {${expected.names.join(', ')}} but found {${signature.names.join(', ')}}`,
        });
      }

      for (const plural of signature.pluralArguments) {
        const missing = required.filter((category) => !plural.categories.includes(category));
        if (missing.length > 0) {
          issues.push({
            locale,
            key,
            code: 'plural-category',
            detail: `plural "${plural.name}" lacks: ${missing.join(', ')}`,
          });
        }
      }
    }
  }

  return issues;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
