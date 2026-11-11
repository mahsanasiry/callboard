const SLUG_MAX_BASE = 40;

/** Latin letters and digits only; names in other scripts fall back to a neutral base. */
export function slugBase(name: string): string {
  const base = name
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SLUG_MAX_BASE)
    .replace(/-+$/g, '');
  return base.length >= 2 ? base : 'studio';
}

export function slugFor(name: string, suffix: string): string {
  return `${slugBase(name)}-${suffix}`;
}
