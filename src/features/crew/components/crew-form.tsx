'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { SelectField } from '@/components/ui/select-field';
import { TextAreaField } from '@/components/ui/textarea-field';
import { TextField } from '@/components/ui/text-field';
import { FormError } from '@/features/auth/components/form-error';
import { useActionSubmit, useValidationMessage } from '@/features/auth/components/use-action-form';
import { LOCALES, locales } from '@/i18n/locales';
import { Link } from '@/i18n/navigation';
import { createCrewAction, updateCrewAction } from '../actions';
import { crewSchema, type CrewInput } from '../schemas';

interface CrewFormProps {
  id: string | null;
  defaults: CrewInput;
  departments: readonly { id: string; name: string }[];
  readOnly: boolean;
}

export function CrewForm({ id, defaults, departments, readOnly }: CrewFormProps) {
  const t = useTranslations('Crew');
  const form = useTranslations('Crew.form');
  const locale = useLocale();
  const message = useValidationMessage();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CrewInput>({ resolver: zodResolver(crewSchema), defaultValues: defaults });
  const { formError, isPending, submit } = useActionSubmit(setError);

  // A person may prefer a language the product is not translated into yet.
  const languageCodes = locales.some((code) => code === defaults.preferredLocale)
    ? [...locales]
    : [...locales, defaults.preferredLocale];

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        void handleSubmit((values) => {
          submit(() =>
            id === null ? createCrewAction(values, locale) : updateCrewAction(id, values, locale),
          );
        })(event);
      }}
    >
      {readOnly ? <p className="notice">{form('readOnly')}</p> : null}
      <FormError error={formError} />
      <fieldset disabled={readOnly} className="flex flex-col gap-5">
        <TextField
          {...register('fullName')}
          autoComplete="off"
          label={form('fullName')}
          error={message(errors.fullName?.message)}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            {...register('roleTitle')}
            label={form('roleTitle')}
            error={message(errors.roleTitle?.message)}
          />
          <SelectField
            {...register('departmentId', {
              setValueAs: (value: string) => (value === '' ? null : value),
            })}
            label={form('department')}
            options={[
              { value: '', label: t('noDepartment') },
              ...departments.map((d) => ({ value: d.id, label: d.name })),
            ]}
            error={message(errors.departmentId?.message)}
          />
          <TextField
            {...register('email')}
            type="email"
            dir="ltr"
            autoComplete="off"
            label={form('email')}
            error={message(errors.email?.message)}
          />
          <TextField
            {...register('phone')}
            type="tel"
            dir="ltr"
            autoComplete="off"
            label={form('phone')}
            error={message(errors.phone?.message)}
          />
          <SelectField
            {...register('preferredLocale')}
            label={form('language')}
            options={languageCodes.map((code) => ({
              value: code,
              label: code in LOCALES ? LOCALES[code as keyof typeof LOCALES].nativeName : code,
            }))}
            error={message(errors.preferredLocale?.message)}
          />
        </div>
        <TextAreaField
          {...register('notes')}
          label={form('notes')}
          error={message(errors.notes?.message)}
        />
      </fieldset>
      <div className="flex flex-wrap items-center gap-3">
        {readOnly ? null : (
          <button type="submit" className="button" disabled={isPending} aria-busy={isPending}>
            {isPending ? form('saving') : form('save')}
          </button>
        )}
        <Link href="/crew" className="button-quiet">
          {form('cancel')}
        </Link>
      </div>
    </form>
  );
}
