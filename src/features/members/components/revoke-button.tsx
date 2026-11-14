'use client';

import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { FormError } from '@/features/auth/components/form-error';
import type { FormErrorKey } from '@/features/auth/result';
import { revokeInvitationAction } from '../actions';

export function RevokeButton({ invitationId }: { invitationId: string }) {
  const t = useTranslations('Members.pending');
  const [error, setError] = useState<FormErrorKey | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-2">
      <FormError error={error} />
      <button
        type="button"
        className="button-quiet"
        disabled={isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await revokeInvitationAction({ invitationId });
            if (result.status === 'error') setError(result.formError ?? 'generic');
          });
        }}
      >
        {isPending ? t('revoking') : t('revoke')}
      </button>
    </div>
  );
}
