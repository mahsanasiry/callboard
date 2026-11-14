'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useLocale, useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { initialsOf } from '@/components/ui/avatar';
import { signOutAction } from '@/features/auth/actions';

interface UserMenuProps {
  displayName: string;
  email: string;
  roleLabel: string;
}

export function UserMenu({ displayName, email, roleLabel }: UserMenuProps) {
  const t = useTranslations('App.userMenu');
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

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
          {/* A form inside the menu is removed from the page before it can submit, so the action is called directly. */}
          <DropdownMenu.Item
            disabled={isPending}
            onSelect={(event) => {
              event.preventDefault();
              startTransition(async () => {
                await signOutAction(locale);
              });
            }}
            className="flex min-h-11 w-full cursor-pointer items-center rounded-md px-3 text-start outline-none data-[disabled]:opacity-60 data-[highlighted]:bg-sunken"
          >
            {t('signOut')}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
