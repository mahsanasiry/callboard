import { describe, expect, it } from 'vitest';
import {
  activeFilterCount,
  clearFilters,
  pageCount,
  parseListState,
  rangeFor,
  serializeListState,
  toggleFilterValue,
  withChange,
  type ListConfig,
} from './state';

const config: ListConfig = {
  sortable: ['name', 'status'],
  defaultSort: { field: 'name', direction: 'asc' },
  filters: { status: ['available', 'retired'], department: null },
  pageSizes: [25, 50, 100],
  searchMaxLength: 20,
};

const parse = (query: string) => parseListState(new URLSearchParams(query), config);

describe('parseListState', () => {
  it('uses the defaults for an empty address', () => {
    expect(parse('')).toEqual({
      query: '',
      sort: { field: 'name', direction: 'asc' },
      filters: {},
      page: 1,
      pageSize: 25,
    });
  });

  it('reads search, sort, filters and paging', () => {
    expect(parse('q=lens&sort=status.desc&status=retired&department=abc-1&page=3&size=50')).toEqual(
      {
        query: 'lens',
        sort: { field: 'status', direction: 'desc' },
        filters: { status: ['retired'], department: ['abc-1'] },
        page: 3,
        pageSize: 50,
      },
    );
  });

  it('trims and shortens the search text', () => {
    expect(parse(`q=${encodeURIComponent('   hello   ')}`).query).toBe('hello');
    expect(parse(`q=${'x'.repeat(50)}`).query).toHaveLength(20);
  });

  it.each(['sort=secret.asc', 'sort=name.sideways', 'sort=name', 'sort=.asc'])(
    'ignores the sort %s',
    (query) => {
      expect(parse(query).sort).toEqual(config.defaultSort);
    },
  );

  it('drops filter values that are not allowed', () => {
    expect(parse('status=available&status=hacked').filters).toEqual({ status: ['available'] });
    expect(parse('status=hacked').filters).toEqual({});
    expect(parse('department=a b&department=ok_1').filters).toEqual({ department: ['ok_1'] });
  });

  it('removes duplicate filter values', () => {
    expect(parse('status=retired&status=retired').filters).toEqual({ status: ['retired'] });
  });

  it('ignores filters it does not know', () => {
    expect(parse('owner=me').filters).toEqual({});
  });

  it.each(['page=0', 'page=-2', 'page=abc', 'page=1.5', 'page=99999999'])(
    'falls back from %s',
    (query) => {
      expect(parse(query).page).toBe(1);
    },
  );

  it('only accepts page sizes from the list', () => {
    expect(parse('size=10000').pageSize).toBe(25);
    expect(parse('size=100').pageSize).toBe(100);
  });
});

describe('serializeListState', () => {
  it('leaves defaults out', () => {
    expect(serializeListState(parse(''), config).toString()).toBe('');
  });

  it('round-trips any valid state', () => {
    const query =
      'q=lens&sort=status.desc&status=available&status=retired&department=x1&size=50&page=2';
    const state = parse(query);
    expect(parse(serializeListState(state, config).toString())).toEqual(state);
  });

  it('writes filters in a stable order', () => {
    const state = parse('department=x1&status=retired');
    expect(serializeListState(state, config).toString()).toBe('status=retired&department=x1');
  });
});

describe('changing the state', () => {
  const base = parse('page=4&status=available');

  it('goes back to the first page when the results change', () => {
    expect(withChange(base, { query: 'camera' }).page).toBe(1);
    expect(withChange(base, { sort: { field: 'status', direction: 'asc' } }).page).toBe(1);
    expect(withChange(base, { pageSize: 50 }).page).toBe(1);
    expect(toggleFilterValue(base, 'status', 'retired').page).toBe(1);
  });

  it('keeps the page when only the page changes', () => {
    expect(withChange(base, { page: 5 }).page).toBe(5);
  });

  it('adds and removes filter values', () => {
    const added = toggleFilterValue(base, 'status', 'retired');
    expect(added.filters.status).toEqual(['available', 'retired']);
    const removed = toggleFilterValue(added, 'status', 'available');
    expect(removed.filters.status).toEqual(['retired']);
    expect(toggleFilterValue(removed, 'status', 'retired').filters).toEqual({});
  });

  it('counts and clears filters', () => {
    const state = parse('status=available&status=retired&department=x1');
    expect(activeFilterCount(state)).toBe(3);
    expect(clearFilters(state).filters).toEqual({});
    expect(clearFilters(state).page).toBe(1);
  });
});

describe('paging maths', () => {
  it('counts pages, with at least one', () => {
    expect(pageCount(0, 25)).toBe(1);
    expect(pageCount(25, 25)).toBe(1);
    expect(pageCount(26, 25)).toBe(2);
    expect(pageCount(101, 50)).toBe(3);
  });

  it('gives a zero-based inclusive database range', () => {
    expect(rangeFor(parse(''))).toEqual({ from: 0, to: 24 });
    expect(rangeFor(parse('page=3&size=50'))).toEqual({ from: 100, to: 149 });
  });
});
