'use client';

import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { SelectField } from '@/components/ui/select-field';
import { FormError } from '@/features/auth/components/form-error';
import type { FormErrorKey } from '@/features/auth/result';
import { ROLES, type Role } from '@/lib/permissions/policy';
import { changeRoleAction, removeMemberAction } from '../actions';
import type { Department } from '../queries';

interface MemberEditorProps {
  membershipId: string;
  name: string;
  organizationName: string;
  role: Role;
  departmentId: string | null;
  departments: readonly Department[];
}

export function MemberEditor({
  membershipId,
  name,
  organizationName,
  role,
  departmentId,
  departments,
}: MemberEditorProps) {
  const t = useTranslations('Members');
  const roles = useTranslations('Roles');
  const [nextRole, setNextRole] = useState<Role>(role);
  const [nextDepartment, setNextDepartment] = useState<string>(departmentId ?? '');
  const [error, setError] = useState<FormErrorKey | null>(null);
  const [saved, setSaved] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  const departmentValid = (nextRole === 'department_lead') === (nextDepartment !== '');
  const unchanged = nextRole === role && (nextDepartment || null) === departmentId;

  return (
    <div className="flex flex-col gap-3">
      <FormError error={error} />
      <div className="flex flex-wrap items-end gap-3">
        <SelectField
          label={t('change.role')}
          value={nextRole}
          onChange={(event) => {
            const value = event.target.value as Role;
            setNextRole(value);
            if (value !== 'department_lead') setNextDepartment('');
            setSaved(false);
          }}
          options={ROLES.map((value) => ({ value, label: roles(value) }))}
        />
        {nextRole === 'department_lead' ? (
          <SelectField
            label={t('change.department')}
            value={nextDepartment}
            onChange={(event) => {
              setNextDepartment(event.target.value);
              setSaved(false);
            }}
            options={[
              { value: '', label: '—' },
              ...departments.map((d) => ({ value: d.id, label: d.name })),
            ]}
          />
        ) : null}
        <button
          type="button"
          className="button-quiet"
          disabled={isPending || unchanged || !departmentValid}
          onClick={() => {
            setError(null);
            setSaved(false);
            startTransition(async () => {
              const result = await changeRoleAction({
                membershipId,
                role: nextRole,
                departmentId: nextDepartment === '' ? null : nextDepartment,
              });
              if (result.status === 'error') setError(result.formError ?? 'generic');
              else setSaved(true);
            });
          }}
        >
          {isPending ? t('change.saving') : t('change.save')}
        </button>
        <button
          type="button"
          className="button-quiet"
          style={{ borderColor: 'var(--ds-danger)', color: 'var(--ds-danger)' }}
          disabled={isPending}
          onClick={() => {
            setConfirming(true);
          }}
        >
          {t('remove.button')}
        </button>
      </div>
      {saved ? (
        <p role="status" className="text-sm">
          {t('change.saved')}
        </p>
      ) : null}
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t('remove.dialogTitle', { name })}
        description={t('remove.dialogBody', { organization: organizationName })}
        confirmLabel={isPending ? t('remove.working') : t('remove.confirm')}
        cancelLabel={t('remove.cancel')}
        pending={isPending}
        onConfirm={() => {
          setError(null);
          startTransition(async () => {
            const result = await removeMemberAction({ membershipId });
            if (result.status === 'error') setError(result.formError ?? 'generic');
            setConfirming(false);
          });
        }}
      />
    </div>
  );
}
