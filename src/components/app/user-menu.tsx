'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useLocale, useTranslations } from 'next-intl';
import { signOutAction } from '@/features/auth/actions';

interface UserMenuProps {
  displayName: string;
  email: string;
  roleLabel: string;
}

function initialsOf(name: string, email: string): string {
  const source = name.trim() || email;
  const parts = source.split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? [parts[0], parts[parts.length - 1]] : [parts[0]];
  return letters
    .map((part) => (part ? Array.from(part)[0] : ''))
    .join('')
    .toUpperCase();
}

export function UserMenu({ displayName, email, roleLabel }: UserMenuProps) {
  const t = useTranslations('App.userMenu');
  const locale = useLocale();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label={t('label')}
        className="inline-flex size-11 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-fg"
      >
        <span aria-hidden="true">{initialsOf(displayName, email)}</span>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-40 min-w-64 rounded-lg border border-line bg-surface p-2 shadow-overlay"
        >
          <div className="px-3 py-2">
            <p className="text-xs text-ink-subtle">{t('signedInAs')}</p>
            <p className="font-medium">{displayName || email}</p>
            <p className="text-sm text-ink-muted" dir="auto">
              {email}
            </p>
            <p className="mt-1 text-sm text-ink-muted">{roleLabel}</p>
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-line" />
          <form action={signOutAction.bind(null, locale)}>
            <DropdownMenu.Item asChild>
              <button
                type="submit"
                className="flex min-h-11 w-full cursor-pointer items-center rounded-md px-3 text-start outline-none data-[highlighted]:bg-sunken"
              >
                {t('signOut')}
              </button>
            </DropdownMenu.Item>
          </form>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
