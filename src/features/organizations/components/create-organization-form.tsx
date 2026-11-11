'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { TextField } from '@/components/ui/text-field';
import { FormError } from '@/features/auth/components/form-error';
import { useActionSubmit, useValidationMessage } from '@/features/auth/components/use-action-form';
import { createOrganizationAction } from '../actions';
import { createOrganizationSchema, type CreateOrganizationInput } from '../schemas';

export function CreateOrganizationForm() {
  const t = useTranslations('Onboarding');
  const locale = useLocale();
  const message = useValidationMessage();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CreateOrganizationInput>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: { name: '' },
  });
  const { formError, isPending, submit } = useActionSubmit(setError);

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        void handleSubmit((values) => {
          submit(() => createOrganizationAction(values, locale));
        })(event);
      }}
    >
      <FormError error={formError} />
      <TextField
        {...register('name')}
        autoComplete="organization"
        label={t('name')}
        error={message(errors.name?.message)}
      />
      <button type="submit" className="button" disabled={isPending} aria-busy={isPending}>
        {isPending ? t('submitting') : t('submit')}
      </button>
    </form>
  );
}
