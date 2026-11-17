'use client';

import { createColumnHelper, tableFeatures, useTable } from '@tanstack/react-table';
import { useFormatter, useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { FilterChips } from '@/components/list/filter-chips';
import { FilterMenu, type FilterDefinition } from '@/components/list/filter-menu';
import { Pagination } from '@/components/list/pagination';
import { SearchBox } from '@/components/list/search-box';
import { SortButton } from '@/components/list/sort-header';
import { Link } from '@/i18n/navigation';
import { activeFilterCount, clearFilters, toggleFilterValue, withChange } from '@/lib/list/state';
import { useListState } from '@/lib/list/use-list-state';
import {
  EQUIPMENT_CATEGORIES,
  EQUIPMENT_STATUSES,
  equipmentListConfig,
  type EquipmentStatus,
} from '../config';
import type { EquipmentRow } from '../queries';

interface EquipmentListProps {
  rows: readonly EquipmentRow[];
  total: number;
  departments: readonly { id: string; name: string }[];
  canSeeArchive: boolean;
}

const STATUS_COLOR: Record<EquipmentStatus, string> = {
  available: 'var(--ds-success)',
  in_use: 'var(--ds-accent)',
  maintenance: 'var(--ds-warning)',
  retired: 'var(--ds-ink-subtle)',
};

const features = tableFeatures({});
const columnHelper = createColumnHelper<typeof features, EquipmentRow>();

const SORT_FIELD_BY_COLUMN: Record<string, string> = {
  name: 'name',
  category: 'category',
  status: 'status',
  updated_at: 'updated',
};

export function EquipmentList({ rows, total, departments, canSeeArchive }: EquipmentListProps) {
  const t = useTranslations('Equipment');
  const list = useTranslations('List');
  const format = useFormatter();
  const { state, navigate, isPending } = useListState(equipmentListConfig);

  const departmentName = useMemo(
    () => new Map(departments.map((department) => [department.id, department.name])),
    [departments],
  );

  const definitions: FilterDefinition[] = [
    {
      name: 'status',
      label: t('filters.status'),
      options: EQUIPMENT_STATUSES.map((value) => ({ value, label: t(`statuses.${value}`) })),
    },
    {
      name: 'category',
      label: t('filters.category'),
      options: EQUIPMENT_CATEGORIES.map((value) => ({ value, label: t(`categories.${value}`) })),
    },
    {
      name: 'department',
      label: t('filters.department'),
      options: departments.map((department) => ({ value: department.id, label: department.name })),
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

  const categoryLabel = (value: string) =>
    (EQUIPMENT_CATEGORIES as readonly string[]).includes(value)
      ? t(`categories.${value as (typeof EQUIPMENT_CATEGORIES)[number]}`)
      : value;

  const statusBadge = (status: EquipmentStatus) => (
    <span className="badge">
      <span className="dot" style={{ color: STATUS_COLOR[status] }} aria-hidden="true" />
      {t(`statuses.${status}`)}
    </span>
  );

  const columns = columnHelper.columns([
    columnHelper.accessor('name', {
      header: () => (
        <SortButton
          label={t('columns.name')}
          field="name"
          active={state.sort}
          onSort={(field, direction) => {
            navigate(withChange(state, { sort: { field, direction } }));
          }}
        />
      ),
      cell: ({ row }) => (
        <div className="flex flex-col">
          <Link href={`/equipment/${row.original.id}`} className="font-medium text-ink">
            {row.original.name}
          </Link>
          {row.original.asset_tag ? (
            <span className="text-sm text-ink-subtle" dir="ltr">
              {t('assetTag', { tag: row.original.asset_tag })}
            </span>
          ) : null}
        </div>
      ),
    }),
    columnHelper.accessor('category', {
      header: () => (
        <SortButton
          label={t('columns.category')}
          field="category"
          active={state.sort}
          onSort={(field, direction) => {
            navigate(withChange(state, { sort: { field, direction } }));
          }}
        />
      ),
      cell: ({ getValue }) => categoryLabel(getValue()),
    }),
    columnHelper.accessor('department_id', {
      header: () => (
        <span className="px-4 text-sm font-medium text-ink-subtle">{t('columns.department')}</span>
      ),
      cell: ({ getValue }) => {
        const id = getValue();
        return id ? (
          (departmentName.get(id) ?? '')
        ) : (
          <span className="text-ink-subtle">{t('noDepartment')}</span>
        );
      },
    }),
    columnHelper.accessor('status', {
      header: () => (
        <SortButton
          label={t('columns.status')}
          field="status"
          active={state.sort}
          onSort={(field, direction) => {
            navigate(withChange(state, { sort: { field, direction } }));
          }}
        />
      ),
      cell: ({ getValue }) => statusBadge(getValue()),
    }),
    columnHelper.accessor('updated_at', {
      header: () => (
        <SortButton
          label={t('columns.updated')}
          field="updated"
          active={state.sort}
          onSort={(field, direction) => {
            navigate(withChange(state, { sort: { field, direction } }));
          }}
        />
      ),
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

  return (
    <div className="flex flex-col gap-4" aria-busy={isPending}>
      <div className="flex flex-wrap items-center gap-3">
        <SearchBox
          value={state.query}
          maxLength={equipmentListConfig.searchMaxLength}
          onSearch={(query) => {
            navigate(withChange(state, { query: query.trim() }));
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
        onClear={() => {
          navigate(clearFilters(withChange(state, { query: '' })));
        }}
      />

      {rows.length === 0 ? (
        <div className="card flex flex-col items-start gap-3 p-6" role="status">
          <p className="text-lg font-semibold">{filtered ? list('noResults') : t('empty.title')}</p>
          {filtered ? (
            <button
              type="button"
              className="button-quiet"
              onClick={() => {
                navigate(clearFilters(withChange(state, { query: '' })));
              }}
            >
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
              <li key={row.id} className="card flex flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/equipment/${row.id}`} className="text-lg font-semibold text-ink">
                    {row.name}
                  </Link>
                  {statusBadge(row.status)}
                </div>
                <p className="text-sm text-ink-muted">
                  {categoryLabel(row.category)}
                  {' · '}
                  {row.department_id
                    ? (departmentName.get(row.department_id) ?? '')
                    : t('noDepartment')}
                </p>
                {row.asset_tag ? (
                  <p className="text-sm text-ink-subtle" dir="ltr">
                    {t('assetTag', { tag: row.asset_tag })}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      )}

      <Pagination
        total={total}
        page={state.page}
        pageSize={state.pageSize}
        pageSizes={equipmentListConfig.pageSizes}
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
