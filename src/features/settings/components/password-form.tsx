'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { PasswordField } from '@/components/ui/password-field';
import { StatusMessage } from '@/components/ui/status-message';
import { FormError } from '@/features/auth/components/form-error';
import { useActionSubmit, useValidationMessage } from '@/features/auth/components/use-action-form';
import {
  PASSWORD_MIN_LENGTH,
  resetPasswordSchema,
  type ResetPasswordInput,
} from '@/features/auth/schemas';
import { changePasswordAction } from '../actions';

export function PasswordForm({ disabled }: { disabled: boolean }) {
  const t = useTranslations('Settings.security');
  const auth = useTranslations('Auth');
  const message = useValidationMessage();
  const [saved, setSaved] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });
  const { formError, isPending, submit } = useActionSubmit(setError);

  if (disabled) return <p className="notice">{t('demoNote')}</p>;

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        setSaved(false);
        void handleSubmit((values) => {
          submit(
            () => changePasswordAction(values),
            () => {
              reset();
              setSaved(true);
            },
          );
        })(event);
      }}
    >
      <FormError error={formError} />
      <PasswordField
        {...register('password')}
        autoComplete="new-password"
        label={auth('reset.newPassword')}
        hint={auth('signup.passwordHint', { min: PASSWORD_MIN_LENGTH })}
        error={message(errors.password?.message)}
      />
      <PasswordField
        {...register('confirmPassword')}
        autoComplete="new-password"
        label={auth('reset.confirmPassword')}
        error={message(errors.confirmPassword?.message)}
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
