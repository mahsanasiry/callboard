export type SortDirection = 'asc' | 'desc';

export interface ListConfig {
  readonly sortable: readonly string[];
  readonly defaultSort: { readonly field: string; readonly direction: SortDirection };
  /** For each filter, the values it accepts. `null` accepts any identifier. */
  readonly filters: Readonly<Record<string, readonly string[] | null>>;
  readonly pageSizes: readonly number[];
  readonly searchMaxLength: number;
}

export interface ListState {
  readonly query: string;
  readonly sort: { readonly field: string; readonly direction: SortDirection };
  readonly filters: Readonly<Record<string, readonly string[]>>;
  readonly page: number;
  readonly pageSize: number;
}

type Source = Pick<URLSearchParams, 'get' | 'getAll'>;

const IDENTIFIER = /^[A-Za-z0-9_-]{1,64}$/;
const MAX_PAGE = 100_000;
const MAX_VALUES_PER_FILTER = 20;

function positiveInteger(value: string | null): number | null {
  if (value === null || !/^\d{1,6}$/.test(value)) return null;
  const parsed = Number.parseInt(value, 10);
  return parsed >= 1 && parsed <= MAX_PAGE ? parsed : null;
}

/**
 * Everything the list shows is in the address, so a refreshed page, the Back
 * button and a link sent to a colleague all land on the same rows. Anything
 * unrecognised falls back to the default instead of failing.
 */
export function parseListState(params: Source, config: ListConfig): ListState {
  const query = (params.get('q') ?? '').trim().slice(0, config.searchMaxLength);

  const sortParam = params.get('sort') ?? '';
  const [sortField = '', sortDirection = ''] = sortParam.split('.');
  const direction: SortDirection | null =
    sortDirection === 'asc' || sortDirection === 'desc' ? sortDirection : null;
  const sort =
    direction !== null && config.sortable.includes(sortField)
      ? { field: sortField, direction }
      : config.defaultSort;

  const filters: Record<string, string[]> = {};
  for (const [name, allowed] of Object.entries(config.filters)) {
    const values = [...new Set(params.getAll(name))]
      .filter((value) => (allowed === null ? IDENTIFIER.test(value) : allowed.includes(value)))
      .slice(0, MAX_VALUES_PER_FILTER);
    if (values.length > 0) filters[name] = values;
  }

  const requestedSize = positiveInteger(params.get('size'));
  const defaultSize = config.pageSizes[0] ?? 25;
  const pageSize =
    requestedSize !== null && config.pageSizes.includes(requestedSize)
      ? requestedSize
      : defaultSize;

  return {
    query,
    sort,
    filters,
    page: positiveInteger(params.get('page')) ?? 1,
    pageSize,
  };
}

/** The shortest address that describes a state: defaults are left out. */
export function serializeListState(state: ListState, config: ListConfig): URLSearchParams {
  const params = new URLSearchParams();
  if (state.query) params.set('q', state.query);

  const { field, direction } = state.sort;
  if (field !== config.defaultSort.field || direction !== config.defaultSort.direction) {
    params.set('sort', `${field}.${direction}`);
  }

  for (const name of Object.keys(config.filters)) {
    for (const value of state.filters[name] ?? []) params.append(name, value);
  }

  if (state.pageSize !== (config.pageSizes[0] ?? 25)) params.set('size', String(state.pageSize));
  if (state.page > 1) params.set('page', String(state.page));
  return params;
}

/** Changing what is searched, filtered or sorted starts again from the first page. */
export function withChange(
  state: ListState,
  change: Partial<Omit<ListState, 'page'>> & { page?: number },
): ListState {
  const resets =
    'query' in change || 'sort' in change || 'filters' in change || 'pageSize' in change;
  return { ...state, ...change, page: change.page ?? (resets ? 1 : state.page) };
}

export function toggleFilterValue(state: ListState, name: string, value: string): ListState {
  const current = state.filters[name] ?? [];
  const next = current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value];
  const others = Object.entries(state.filters).filter(([key]) => key !== name);
  const filters = Object.fromEntries(next.length > 0 ? [...others, [name, next]] : others);
  return withChange(state, { filters });
}

export function clearFilters(state: ListState): ListState {
  return withChange(state, { filters: {} });
}

export function activeFilterCount(state: ListState): number {
  return Object.values(state.filters).reduce((total, values) => total + values.length, 0);
}

export function pageCount(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

/** Zero-based inclusive range for a database query. */
export function rangeFor(state: ListState): { from: number; to: number } {
  const from = (state.page - 1) * state.pageSize;
  return { from, to: from + state.pageSize - 1 };
}
