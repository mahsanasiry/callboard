'use client';

import { createColumnHelper, tableFeatures, useTable } from '@tanstack/react-table';
import { useFormatter, useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { FilterChips } from '@/components/list/filter-chips';
import { FilterMenu, type FilterDefinition } from '@/components/list/filter-menu';
import { Pagination } from '@/components/list/pagination';
import { SearchBox } from '@/components/list/search-box';
import { SortButton } from '@/components/list/sort-header';
import { LOCALES, isLocale } from '@/i18n/locales';
import { Link } from '@/i18n/navigation';
import { activeFilterCount, clearFilters, toggleFilterValue, withChange } from '@/lib/list/state';
import { useListState } from '@/lib/list/use-list-state';
import { crewListConfig } from '../config';
import type { CrewRow } from '../queries';

interface CrewListProps {
  rows: readonly CrewRow[];
  total: number;
  departments: readonly { id: string; name: string }[];
  locales: readonly string[];
  canSeeArchive: boolean;
}

const features = tableFeatures({});
const columnHelper = createColumnHelper<typeof features, CrewRow>();

const SORT_FIELD_BY_COLUMN: Record<string, string> = {
  full_name: 'name',
  role_title: 'title',
  updated_at: 'updated',
};

function languageName(code: string): string {
  return isLocale(code) ? LOCALES[code].nativeName : code;
}

export function CrewList({ rows, total, departments, locales, canSeeArchive }: CrewListProps) {
  const t = useTranslations('Crew');
  const list = useTranslations('List');
  const format = useFormatter();
  const { state, navigate, isPending } = useListState(crewListConfig);

  const departmentName = useMemo(
    () => new Map(departments.map((department) => [department.id, department.name])),
    [departments],
  );

  const definitions: FilterDefinition[] = [
    {
      name: 'department',
      label: t('filters.department'),
      options: departments.map((department) => ({ value: department.id, label: department.name })),
    },
    {
      name: 'locale',
      label: t('filters.language'),
      options: locales.map((code) => ({ value: code, label: languageName(code) })),
    },
    ...(canSeeArchive
      ? [
          {
            name: 'archive',
            label: t('filters.archive'),
            options: [{ value: 'only', label: t('filters.archiveOnly') }],
          },
        ]
      : []),
  ];

  const sortButton = (label: string, field: string) => (
    <SortButton
      label={label}
      field={field}
      active={state.sort}
      onSort={(nextField, direction) => {
        navigate(withChange(state, { sort: { field: nextField, direction } }));
      }}
    />
  );

  const departmentLabel = (id: string | null) =>
    id ? (departmentName.get(id) ?? '') : t('noDepartment');

  const columns = columnHelper.columns([
    columnHelper.accessor('full_name', {
      header: () => sortButton(t('columns.name'), 'name'),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.original.full_name} className="size-9 text-sm" />
          <Link href={`/crew/${row.original.id}`} className="font-medium text-ink">
            {row.original.full_name}
          </Link>
        </div>
      ),
    }),
    columnHelper.accessor('role_title', {
      header: () => sortButton(t('columns.title'), 'title'),
      cell: ({ getValue }) => getValue(),
    }),
    columnHelper.accessor('department_id', {
      header: () => (
        <span className="px-4 text-sm font-medium text-ink-subtle">{t('columns.department')}</span>
      ),
      cell: ({ getValue }) => departmentLabel(getValue()),
    }),
    columnHelper.accessor('preferred_locale', {
      header: () => (
        <span className="px-4 text-sm font-medium text-ink-subtle">{t('columns.language')}</span>
      ),
      cell: ({ getValue }) => <span dir="auto">{languageName(getValue())}</span>,
    }),
    columnHelper.accessor('updated_at', {
      header: () => sortButton(t('columns.updated'), 'updated'),
      cell: ({ getValue }) => (
        <span className="text-ink-muted">
          {format.dateTime(new Date(getValue()), { dateStyle: 'medium' })}
        </span>
      ),
    }),
  ]);

  const table = useTable({ features, columns, data: rows });

  function ariaSort(columnId: string): 'ascending' | 'descending' | 'none' {
    const field = SORT_FIELD_BY_COLUMN[columnId];
    if (field === undefined || state.sort.field !== field) return 'none';
    return state.sort.direction === 'asc' ? 'ascending' : 'descending';
  }

  const filtered = activeFilterCount(state) > 0 || state.query !== '';
  const resetAll = () => {
    navigate(clearFilters(withChange(state, { query: '' })));
  };

  return (
    <div className="flex flex-col gap-4" aria-busy={isPending}>
      <div className="flex flex-wrap items-center gap-3">
        <SearchBox
          value={state.query}
          maxLength={crewListConfig.searchMaxLength}
          onSearch={(query) => {
            navigate(withChange(state, { query }));
          }}
        />
        {definitions.map((definition) => (
          <FilterMenu
            key={definition.name}
            definition={definition}
            selected={state.filters[definition.name] ?? []}
            onToggle={(name, value) => {
              navigate(toggleFilterValue(state, name, value));
            }}
          />
        ))}
      </div>

      <FilterChips
        definitions={definitions}
        selected={state.filters}
        onRemove={(name, value) => {
          navigate(toggleFilterValue(state, name, value));
        }}
        onClear={resetAll}
      />

      {rows.length === 0 ? (
        <div className="card flex flex-col items-start gap-3 p-6" role="status">
          <p className="text-lg font-semibold">{filtered ? list('noResults') : t('empty.title')}</p>
          {filtered ? (
            <button type="button" className="button-quiet" onClick={resetAll}>
              {list('clearFilters')}
            </button>
          ) : (
            <p className="text-ink-muted">{t('empty.body')}</p>
          )}
        </div>
      ) : (
        <>
          <div className="card hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-start">
              <thead>
                {table.getHeaderGroups().map((group) => (
                  <tr key={group.id} className="border-b border-line">
                    {group.headers.map((header) => (
                      <th
                        key={header.id}
                        scope="col"
                        aria-sort={ariaSort(header.column.id)}
                        className="p-0 text-start"
                      >
                        {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="border-b border-line last:border-b-0 hover:bg-raised">
                    {row.getAllCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 align-middle">
                        <table.FlexRender cell={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="grid gap-3 md:hidden">
            {rows.map((row) => (
              <li key={row.id} className="card flex items-center gap-4 p-4">
                <Avatar name={row.full_name} className="size-11 text-base" />
                <div className="flex min-w-0 flex-col gap-0.5">
                  <Link
                    href={`/crew/${row.id}`}
                    className="truncate text-lg font-semibold text-ink"
                  >
                    {row.full_name}
                  </Link>
                  <p className="truncate text-sm text-ink-muted">
                    {row.role_title || t('noContact')}
                    {' · '}
                    {departmentLabel(row.department_id)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <Pagination
        total={total}
        page={state.page}
        pageSize={state.pageSize}
        pageSizes={crewListConfig.pageSizes}
        onPage={(page) => {
          navigate(withChange(state, { page }));
        }}
        onPageSize={(pageSize) => {
          navigate(withChange(state, { pageSize }));
        }}
      />
    </div>
  );
}
