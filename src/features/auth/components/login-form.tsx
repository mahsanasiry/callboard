'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { PasswordField } from '@/components/ui/password-field';
import { TextField } from '@/components/ui/text-field';
import { Link } from '@/i18n/navigation';
import { signInAction } from '../actions';
import type { FormErrorKey } from '../result';
import { loginSchema, type LoginInput } from '../schemas';
import { FormError } from './form-error';
import { useActionSubmit, useValidationMessage } from './use-action-form';

interface LoginFormProps {
  next: string | null;
  initialError: FormErrorKey | null;
}

export function LoginForm({ next, initialError }: LoginFormProps) {
  const t = useTranslations('Auth');
  const locale = useLocale();
  const message = useValidationMessage();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  const { formError, isPending, submit } = useActionSubmit(setError, initialError);

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        void handleSubmit((values) => {
          submit(() => signInAction(values, locale, next));
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
      <PasswordField
        {...register('password')}
        autoComplete="current-password"
        label={t('password')}
        error={message(errors.password?.message)}
      />
      <button type="submit" className="button" disabled={isPending} aria-busy={isPending}>
        {isPending ? t('login.submitting') : t('login.submit')}
      </button>
      <p className="text-sm">
        <Link href="/forgot-password" className="text-accent">
          {t('login.forgot')}
        </Link>
      </p>
    </form>
  );
}
