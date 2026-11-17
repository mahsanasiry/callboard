'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { SelectField } from '@/components/ui/select-field';
import { TextAreaField } from '@/components/ui/textarea-field';
import { TextField } from '@/components/ui/text-field';
import { FormError } from '@/features/auth/components/form-error';
import { useActionSubmit, useValidationMessage } from '@/features/auth/components/use-action-form';
import { Link } from '@/i18n/navigation';
import { checkEquipmentNameAction, createEquipmentAction, updateEquipmentAction } from '../actions';
import { EQUIPMENT_CATEGORIES, EQUIPMENT_STATUSES } from '../config';
import { equipmentSchema, type EquipmentInput } from '../schemas';

interface EquipmentFormProps {
  /** Set when editing an existing item. */
  id: string | null;
  defaults: EquipmentInput;
  departments: readonly { id: string; name: string }[];
  /** A department lead may only use their own department. */
  lockedDepartmentId: string | null;
  readOnly: boolean;
}

export function EquipmentForm({
  id,
  defaults,
  departments,
  lockedDepartmentId,
  readOnly,
}: EquipmentFormProps) {
  const t = useTranslations('Equipment');
  const form = useTranslations('Equipment.form');
  const locale = useLocale();
  const message = useValidationMessage();
  const [checking, setChecking] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    getValues,
    formState: { errors },
  } = useForm<EquipmentInput>({ resolver: zodResolver(equipmentSchema), defaultValues: defaults });
  const { formError, isPending, submit } = useActionSubmit(setError);

  async function checkName() {
    const name = getValues('name').trim();
    if (name === '' || name.toLowerCase() === defaults.name.toLowerCase()) return;
    setChecking(true);
    const free = await checkEquipmentNameAction(name, id);
    setChecking(false);
    if (!free) setError('name', { type: 'server', message: 'name.taken' });
    else clearErrors('name');
  }

  const departmentOptions =
    lockedDepartmentId === null
      ? [
          { value: '', label: t('noDepartment') },
          ...departments.map((d) => ({ value: d.id, label: d.name })),
        ]
      : departments
          .filter((d) => d.id === lockedDepartmentId)
          .map((d) => ({ value: d.id, label: d.name }));

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        void handleSubmit((values) => {
          submit(() =>
            id === null
              ? createEquipmentAction(values, locale)
              : updateEquipmentAction(id, values, locale),
          );
        })(event);
      }}
    >
      {readOnly ? <p className="notice">{form('readOnly')}</p> : null}
      <FormError error={formError} />
      <fieldset disabled={readOnly} className="flex flex-col gap-5">
        <TextField
          {...register('name', {
            onBlur: () => {
              void checkName();
            },
          })}
          label={form('name')}
          hint={checking ? form('checking') : undefined}
          error={message(errors.name?.message)}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField
            {...register('category')}
            label={form('category')}
            options={EQUIPMENT_CATEGORIES.map((value) => ({
              value,
              label: t(`categories.${value}`),
            }))}
            error={message(errors.category?.message)}
          />
          <SelectField
            {...register('status')}
            label={form('status')}
            options={EQUIPMENT_STATUSES.map((value) => ({ value, label: t(`statuses.${value}`) }))}
            error={message(errors.status?.message)}
          />
          <SelectField
            {...register('departmentId', {
              setValueAs: (value: string) => (value === '' ? null : value),
            })}
            label={form('department')}
            options={departmentOptions}
            error={message(errors.departmentId?.message)}
          />
          <TextField
            {...register('assetTag')}
            label={form('assetTag')}
            dir="ltr"
            error={message(errors.assetTag?.message)}
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
        <Link href="/equipment" className="button-quiet">
          {form('cancel')}
        </Link>
      </div>
    </form>
  );
}
