'use client';

import { useTranslations } from 'next-intl';
import type { SortDirection } from '@/lib/list/state';

interface SortButtonProps {
  label: string;
  field: string;
  active: { field: string; direction: SortDirection };
  onSort: (field: string, direction: SortDirection) => void;
}

export function SortButton({ label, field, active, onSort }: SortButtonProps) {
  const t = useTranslations('List');
  const isActive = active.field === field;
  const next: SortDirection = isActive && active.direction === 'asc' ? 'desc' : 'asc';

  return (
    <button
      type="button"
      onClick={() => {
        onSort(field, next);
      }}
      className="inline-flex min-h-11 items-center gap-1.5 px-4 text-sm font-medium text-ink-subtle hover:text-ink"
      aria-label={t('sortBy', { column: label })}
    >
      {label}
      <svg
        viewBox="0 0 24 24"
        className={`size-3.5 ${isActive ? 'text-accent' : 'opacity-40'}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {isActive && active.direction === 'desc' ? (
          <path d="m6 9 6 6 6-6" />
        ) : (
          <path d="m6 15 6-6 6 6" />
        )}
      </svg>
    </button>
  );
}
