'use client';

import { useTranslations } from 'next-intl';
import { pageCount } from '@/lib/list/state';

interface PaginationProps {
  total: number;
  page: number;
  pageSize: number;
  pageSizes: readonly number[];
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
}

export function Pagination({
  total,
  page,
  pageSize,
  pageSizes,
  onPage,
  onPageSize,
}: PaginationProps) {
  const t = useTranslations('List');
  const pages = pageCount(total, pageSize);
  const current = Math.min(page, pages);
  const from = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const to = Math.min(total, current * pageSize);

  return (
    <nav aria-label={t('pagination')} className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-ink-muted" role="status">
        {t('range', { from, to, total })}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-ink-muted">{t('pageSize')}</span>
          <select
            value={pageSize}
            onChange={(event) => {
              onPageSize(Number(event.target.value));
            }}
            className="control"
          >
            {pageSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="button-quiet"
            disabled={current <= 1}
            onClick={() => {
              onPage(current - 1);
            }}
          >
            {t('previous')}
          </button>
          <span className="px-1 text-sm text-ink-muted">
            {t('pageOf', { page: current, pages })}
          </span>
          <button
            type="button"
            className="button-quiet"
            disabled={current >= pages}
            onClick={() => {
              onPage(current + 1);
            }}
          >
            {t('next')}
          </button>
        </div>
      </div>
    </nav>
  );
}
