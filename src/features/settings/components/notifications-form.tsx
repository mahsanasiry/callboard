'use client';

import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { StatusMessage } from '@/components/ui/status-message';
import { FormError } from '@/features/auth/components/form-error';
import type { FormErrorKey } from '@/features/auth/result';
import { updateNotificationsAction } from '../actions';
import { NOTIFICATION_TYPES, type NotificationPreferences } from '../schemas';

export function NotificationsForm({ defaults }: { defaults: NotificationPreferences }) {
  const t = useTranslations('Settings.notifications');
  const [values, setValues] = useState(defaults);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<FormErrorKey | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        setSaved(false);
        setError(null);
        startTransition(async () => {
          const result = await updateNotificationsAction(values);
          if (result.status === 'error') setError(result.formError ?? 'generic');
          else setSaved(true);
        });
      }}
    >
      <FormError error={error} />
      <fieldset className="flex flex-col gap-1">
        <legend className="mb-2 text-sm text-ink-muted">{t('intro')}</legend>
        {NOTIFICATION_TYPES.map((type) => (
          <label key={type} className="flex min-h-11 cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={values[type]}
              onChange={(event) => {
                setSaved(false);
                setValues((current) => ({ ...current, [type]: event.target.checked }));
              }}
              className="size-5 accent-accent"
            />
            <span>{t(type)}</span>
          </label>
        ))}
      </fieldset>
      {saved ? <StatusMessage>{t('saved')}</StatusMessage> : null}
      <button
        type="submit"
        className="button self-start"
        disabled={isPending}
        aria-busy={isPending}
      >
        {isPending ? t('submitting') : t('submit')}
      </button>
    </form>
  );
}
