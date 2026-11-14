'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useTranslations } from 'next-intl';
import { THEME_MODES, type ThemeMode } from '@/lib/theme/preferences';
import { useThemePreferences } from './use-theme-preferences';

function ModeIcon({ mode }: { mode: ThemeMode }) {
  const common = {
    viewBox: '0 0 24 24',
    className: 'size-5',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  if (mode === 'light') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    );
  }
  if (mode === 'dark') {
    return (
      <svg {...common}>
        <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  );
}

export function ThemeMenu() {
  const t = useTranslations('Theme');
  const [preferences, update] = useThemePreferences();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label={t('menu')}
        className="inline-flex size-11 items-center justify-center rounded-full border border-line-strong bg-surface text-ink hover:border-ink-subtle"
      >
        <ModeIcon mode={preferences.mode} />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-40 min-w-48 rounded-lg border border-line bg-surface p-1.5 shadow-overlay"
        >
          <DropdownMenu.Label className="px-3 py-1.5 text-xs text-ink-subtle">
            {t('mode.label')}
          </DropdownMenu.Label>
          <DropdownMenu.RadioGroup
            value={preferences.mode}
            onValueChange={(value) => {
              update({ mode: value as ThemeMode });
            }}
          >
            {THEME_MODES.map((mode) => (
              <DropdownMenu.RadioItem
                key={mode}
                value={mode}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-3 outline-none data-[highlighted]:bg-sunken"
              >
                <ModeIcon mode={mode} />
                <span className="flex-1">{t(`mode.${mode}`)}</span>
                <DropdownMenu.ItemIndicator>
                  <svg
                    viewBox="0 0 24 24"
                    className="size-4 text-accent"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m5 12 5 5L20 7" />
                  </svg>
                </DropdownMenu.ItemIndicator>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
