'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { TextField } from '@/components/ui/text-field';
import { FormError } from '@/features/auth/components/form-error';
import { useActionSubmit, useValidationMessage } from '@/features/auth/components/use-action-form';
import { deleteAccountAction } from '../actions';
import { deleteAccountSchema, type DeleteAccountInput } from '../schemas';

export function DeleteAccountForm({ email, disabled }: { email: string; disabled: boolean }) {
  const t = useTranslations('Settings.danger');
  const locale = useLocale();
  const message = useValidationMessage();
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    getValues,
    formState: { errors },
  } = useForm<DeleteAccountInput>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: { confirmation: '' },
  });
  const { formError, isPending, submit } = useActionSubmit(setError);

  if (disabled) return <p className="notice">{t('demoNote')}</p>;

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        void handleSubmit(() => {
          setOpen(true);
        })(event);
      }}
    >
      <FormError error={formError} />
      <TextField
        {...register('confirmation')}
        autoComplete="off"
        label={t('confirm', { email })}
        error={message(errors.confirmation?.message)}
      />
      <button
        type="submit"
        className="button-quiet self-start"
        style={{ borderColor: 'var(--ds-danger)', color: 'var(--ds-danger)' }}
      >
        {t('button')}
      </button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={t('dialogTitle')}
        description={t('dialogBody')}
        confirmLabel={isPending ? t('working') : t('dialogConfirm')}
        cancelLabel={t('cancel')}
        pending={isPending}
        onConfirm={() => {
          submit(() => deleteAccountAction(getValues(), locale));
          setOpen(false);
        }}
      />
    </form>
  );
}
