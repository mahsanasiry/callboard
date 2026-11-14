'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { SelectField } from '@/components/ui/select-field';
import { TextField } from '@/components/ui/text-field';
import { FormError } from '@/features/auth/components/form-error';
import type { FormErrorKey } from '@/features/auth/result';
import { useValidationMessage } from '@/features/auth/components/use-action-form';
import { ROLES } from '@/lib/permissions/policy';
import { createInvitationAction } from '../actions';
import type { Department } from '../queries';
import { inviteSchema, type InviteInput } from '../schemas';
import { useTransition } from 'react';

export function InviteForm({ departments }: { departments: readonly Department[] }) {
  const t = useTranslations('Members.invite');
  const roles = useTranslations('Roles');
  const locale = useLocale();
  const message = useValidationMessage();
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [formError, setFormError] = useState<FormErrorKey | null>(null);
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<InviteInput>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: '', role: 'viewer', departmentId: null },
  });
  const role = useWatch({ control, name: 'role' });

  return (
    <div className="flex flex-col gap-5">
      <form
        noValidate
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          setLink(null);
          setCopied(false);
          setFormError(null);
          void handleSubmit((values) => {
            startTransition(async () => {
              const result = await createInvitationAction(values, locale);
              if (result.status === 'invited') {
                setLink(result.link);
                reset({ email: '', role: 'viewer', departmentId: null });
              } else if (result.status === 'error') {
                if (result.formError) setFormError(result.formError);
                for (const [field, key] of Object.entries(result.fieldErrors ?? {})) {
                  if (key !== undefined) {
                    setError(
                      field as keyof InviteInput,
                      { type: 'server', message: key },
                      { shouldFocus: true },
                    );
                  }
                }
              }
            });
          })(event);
        }}
      >
        <FormError error={formError} />
        <TextField
          {...register('email')}
          type="email"
          autoComplete="off"
          label={t('email')}
          error={message(errors.email?.message)}
        />
        <SelectField
          {...register('role', {
            onChange: (event: { target: { value: string } }) => {
              if (event.target.value !== 'department_lead') setValue('departmentId', null);
            },
          })}
          label={t('role')}
          options={ROLES.map((value) => ({ value, label: roles(value) }))}
        />
        {role === 'department_lead' ? (
          <SelectField
            {...register('departmentId', {
              setValueAs: (value: string) => (value === '' ? null : value),
            })}
            label={t('department')}
            options={[
              { value: '', label: '—' },
              ...departments.map((d) => ({ value: d.id, label: d.name })),
            ]}
            error={message(errors.departmentId?.message)}
          />
        ) : null}
        <button
          type="submit"
          className="button self-start"
          disabled={isPending}
          aria-busy={isPending}
        >
          {isPending ? t('submitting') : t('submit')}
        </button>
      </form>

      {link ? (
        <div className="notice flex flex-col gap-3" role="status">
          <p className="font-medium">{t('linkTitle')}</p>
          <p className="text-ink-muted">{t('linkHint')}</p>
          <input
            readOnly
            value={link}
            dir="ltr"
            className="control w-full"
            aria-label={t('linkTitle')}
            onFocus={(event) => {
              event.currentTarget.select();
            }}
          />
          <button
            type="button"
            className="button-quiet self-start"
            onClick={() => {
              void navigator.clipboard.writeText(link).then(() => {
                setCopied(true);
              });
            }}
          >
            {copied ? t('copied') : t('copy')}
          </button>
        </div>
      ) : null}
    </div>
  );
}
