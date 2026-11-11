'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import type { Role } from '@/lib/permissions/policy';
import { signInAsDemoAction } from '../actions';
import type { FormErrorKey } from '../result';
import { FormError } from './form-error';

export function DemoSignIn({ roles }: { roles: readonly Role[] }) {
  const t = useTranslations('Auth.demo');
  const roleNames = useTranslations('Roles');
  const summaries = useTranslations('RoleSummary');
  const locale = useLocale();
  const [error, setError] = useState<FormErrorKey | null>(null);
  const [pendingRole, setPendingRole] = useState<Role | null>(null);
  const [isPending, startTransition] = useTransition();

  function signInAs(role: Role) {
    setError(null);
    setPendingRole(role);
    startTransition(async () => {
      const result = await signInAsDemoAction(role, locale);
      if (result.status === 'error') setError(result.formError ?? 'generic');
      setPendingRole(null);
    });
  }

  return (
    <section aria-labelledby="demo-heading" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id="demo-heading" className="text-xl font-semibold">
          {t('title')}
        </h2>
        <p className="text-sm text-ink-muted">{t('intro')}</p>
      </div>
      <FormError error={error} />
      <ul className="flex flex-col gap-2">
        {roles.map((role) => (
          <li key={role}>
            <button
              type="button"
              className="button-quiet w-full flex-col items-start gap-0.5 py-2 text-start"
              disabled={isPending}
              aria-busy={pendingRole === role}
              onClick={() => {
                signInAs(role);
              }}
            >
              <span>
                {pendingRole === role ? t('working') : t('signInAs', { role: roleNames(role) })}
              </span>
              <span className="text-sm font-normal text-ink-subtle">{summaries(role)}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
