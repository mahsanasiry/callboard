'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { TextField } from '@/components/ui/text-field';
import { forgotPasswordAction } from '../actions';
import { forgotPasswordSchema, type ForgotPasswordInput } from '../schemas';
import { FormError } from './form-error';
import { useActionSubmit, useValidationMessage } from './use-action-form';

export function ForgotPasswordForm() {
  const t = useTranslations('Auth');
  const locale = useLocale();
  const message = useValidationMessage();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });
  const { formError, isPending, submit } = useActionSubmit(setError);

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        void handleSubmit((values) => {
          submit(() => forgotPasswordAction(values, locale));
        })(event);
      }}
    >
      <FormError error={formError} />
      <TextField
        {...register('email')}
        type="email"
        autoComplete="email"
        label={t('email')}
        error={message(errors.email?.message)}
      />
      <button type="submit" className="button" disabled={isPending} aria-busy={isPending}>
        {isPending ? t('forgot.submitting') : t('forgot.submit')}
      </button>
    </form>
  );
}
