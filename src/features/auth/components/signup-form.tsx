'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { PasswordField } from '@/components/ui/password-field';
import { TextField } from '@/components/ui/text-field';
import { signUpAction } from '../actions';
import { PASSWORD_MIN_LENGTH, signupSchema, type SignupInput } from '../schemas';
import { FormError } from './form-error';
import { useActionSubmit, useValidationMessage } from './use-action-form';

export function SignupForm() {
  const t = useTranslations('Auth');
  const locale = useLocale();
  const message = useValidationMessage();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { displayName: '', email: '', password: '', confirmPassword: '' },
  });
  const { formError, isPending, submit } = useActionSubmit(setError);

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        void handleSubmit((values) => {
          submit(() => signUpAction(values, locale));
        })(event);
      }}
    >
      <FormError error={formError} />
      <TextField
        {...register('displayName')}
        autoComplete="name"
        label={t('signup.name')}
        error={message(errors.displayName?.message)}
      />
      <TextField
        {...register('email')}
        type="email"
        autoComplete="email"
        label={t('email')}
        error={message(errors.email?.message)}
      />
      <PasswordField
        {...register('password')}
        autoComplete="new-password"
        label={t('password')}
        hint={t('signup.passwordHint', { min: PASSWORD_MIN_LENGTH })}
        error={message(errors.password?.message)}
      />
      <PasswordField
        {...register('confirmPassword')}
        autoComplete="new-password"
        label={t('signup.confirmPassword')}
        error={message(errors.confirmPassword?.message)}
      />
      <button type="submit" className="button" disabled={isPending} aria-busy={isPending}>
        {isPending ? t('signup.submitting') : t('signup.submit')}
      </button>
    </form>
  );
}
