'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { FormError } from '@/features/auth/components/form-error';
import type { FormErrorKey } from '@/features/auth/result';
import { acceptInvitationAction } from '../actions';

export function AcceptInvitationForm({ token }: { token: string }) {
  const t = useTranslations('Invite');
  const locale = useLocale();
  const [error, setError] = useState<FormErrorKey | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-5">
      <FormError error={error} />
      <button
        type="button"
        className="button"
        disabled={isPending}
        aria-busy={isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await acceptInvitationAction({ token }, locale);
            if (result.status === 'error') setError(result.formError ?? 'generic');
          });
        }}
      >
        {isPending ? t('accepting') : t('accept')}
      </button>
    </div>
  );
}
