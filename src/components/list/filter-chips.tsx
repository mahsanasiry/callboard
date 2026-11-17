'use client';

import { useTranslations } from 'next-intl';
import type { FilterDefinition } from './filter-menu';

interface FilterChipsProps {
  definitions: readonly FilterDefinition[];
  selected: Readonly<Record<string, readonly string[]>>;
  onRemove: (name: string, value: string) => void;
  onClear: () => void;
}

export function FilterChips({ definitions, selected, onRemove, onClear }: FilterChipsProps) {
  const t = useTranslations('List');
  const chips = definitions.flatMap((definition) =>
    (selected[definition.name] ?? []).map((value) => ({
      key: `${definition.name}:${value}`,
      filter: definition.label,
      name: definition.name,
      value,
      label: definition.options.find((option) => option.value === value)?.label ?? value,
    })),
  );

  if (chips.length === 0) return null;

  return (
    <ul className="flex flex-wrap items-center gap-2" aria-label={t('activeFilters')}>
      {chips.map((chip) => (
        <li key={chip.key} className="chip chip-yes py-0 ps-3 pe-1">
          <span>
            <span className="text-ink-muted">{chip.filter}: </span>
            {chip.label}
          </span>
          <button
            type="button"
            onClick={() => {
              onRemove(chip.name, chip.value);
            }}
            aria-label={t('removeFilter', { filter: chip.filter, value: chip.label })}
            className="inline-flex size-9 items-center justify-center rounded-full hover:bg-raised"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </li>
      ))}
      <li>
        <button
          type="button"
          onClick={onClear}
          className="min-h-11 px-2 text-sm font-medium text-accent"
        >
          {t('clearAll')}
        </button>
      </li>
    </ul>
  );
}
