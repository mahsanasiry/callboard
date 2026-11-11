'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { PasswordField } from '@/components/ui/password-field';
import { resetPasswordAction } from '../actions';
import { PASSWORD_MIN_LENGTH, resetPasswordSchema, type ResetPasswordInput } from '../schemas';
import { FormError } from './form-error';
import { useActionSubmit, useValidationMessage } from './use-action-form';

export function ResetPasswordForm() {
  const t = useTranslations('Auth');
  const locale = useLocale();
  const message = useValidationMessage();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });
  const { formError, isPending, submit } = useActionSubmit(setError);

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        void handleSubmit((values) => {
          submit(() => resetPasswordAction(values, locale));
        })(event);
      }}
    >
      <FormError error={formError} />
      <PasswordField
        {...register('password')}
        autoComplete="new-password"
        label={t('reset.newPassword')}
        hint={t('signup.passwordHint', { min: PASSWORD_MIN_LENGTH })}
        error={message(errors.password?.message)}
      />
      <PasswordField
        {...register('confirmPassword')}
        autoComplete="new-password"
        label={t('reset.confirmPassword')}
        error={message(errors.confirmPassword?.message)}
      />
      <button type="submit" className="button" disabled={isPending} aria-busy={isPending}>
        {isPending ? t('reset.submitting') : t('reset.submit')}
      </button>
    </form>
  );
}
