'use client';

import * as Popover from '@radix-ui/react-popover';
import { useTranslations } from 'next-intl';

export interface FilterDefinition {
  name: string;
  label: string;
  options: readonly { value: string; label: string }[];
}

interface FilterMenuProps {
  definition: FilterDefinition;
  selected: readonly string[];
  onToggle: (name: string, value: string) => void;
}

export function FilterMenu({ definition, selected, onToggle }: FilterMenuProps) {
  const t = useTranslations('List');

  return (
    <Popover.Root>
      <Popover.Trigger className="button-quiet gap-2">
        {definition.label}
        {selected.length > 0 ? (
          <span className="rounded-full bg-accent px-2 text-xs font-semibold text-accent-fg">
            {selected.length}
          </span>
        ) : null}
        <svg
          viewBox="0 0 24 24"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          className="z-40 max-h-80 min-w-56 overflow-y-auto rounded-lg border border-line bg-surface p-2 shadow-overlay"
        >
          <fieldset>
            <legend className="px-2 py-1 text-xs text-ink-subtle">
              {t('filterBy', { filter: definition.label })}
            </legend>
            {definition.options.map((option) => (
              <label
                key={option.value}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-2 hover:bg-raised"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option.value)}
                  onChange={() => {
                    onToggle(definition.name, option.value);
                  }}
                  className="size-5 accent-accent"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </fieldset>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
