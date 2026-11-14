'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { SelectField } from '@/components/ui/select-field';
import { StatusMessage } from '@/components/ui/status-message';
import { TextField } from '@/components/ui/text-field';
import { FormError } from '@/features/auth/components/form-error';
import { useActionSubmit, useValidationMessage } from '@/features/auth/components/use-action-form';
import { LOCALES, locales } from '@/i18n/locales';
import { updateProfileAction } from '../actions';
import { profileSchema, type ProfileInput } from '../schemas';

interface ProfileFormProps {
  defaults: ProfileInput;
  timeZones: readonly string[];
}

export function ProfileForm({ defaults, timeZones }: ProfileFormProps) {
  const t = useTranslations('Settings.profile');
  const locale = useLocale();
  const message = useValidationMessage();
  const [saved, setSaved] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ProfileInput>({ resolver: zodResolver(profileSchema), defaultValues: defaults });
  const { formError, isPending, submit } = useActionSubmit(setError);

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        setSaved(false);
        void handleSubmit((values) => {
          submit(
            () => updateProfileAction(values, locale),
            () => {
              setSaved(true);
            },
          );
        })(event);
      }}
    >
      <FormError error={formError} />
      <TextField
        {...register('displayName')}
        autoComplete="name"
        label={t('name')}
        error={message(errors.displayName?.message)}
      />
      <SelectField
        {...register('locale')}
        label={t('language')}
        options={locales.map((code) => ({ value: code, label: LOCALES[code].nativeName }))}
        error={message(errors.locale?.message)}
      />
      <SelectField
        {...register('timeZone')}
        label={t('timeZone')}
        options={timeZones.map((zone) => ({ value: zone, label: zone }))}
        error={message(errors.timeZone?.message)}
      />
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
