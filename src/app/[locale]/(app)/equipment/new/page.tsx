import { getTranslations } from 'next-intl/server';
import { EquipmentForm } from '@/features/equipment/components/equipment-form';
import { listDepartments } from '@/features/members/queries';
import { getCurrentMembership } from '@/features/organizations/queries';
import { Link } from '@/i18n/navigation';
import { redirectNow } from '@/i18n/redirect-now';
import { resolveLocale, type LocaleParams } from '@/i18n/resolve-locale';
import { DeniedNotice } from '@/lib/permissions/notice';
import { can } from '@/lib/permissions/policy';
import { getSubject } from '@/lib/permissions/server';

export async function generateMetadata(props: LocaleParams) {
  const locale = await resolveLocale(props);
  const t = await getTranslations({ locale, namespace: 'Equipment.form' });
  return { title: t('createTitle') };
}

export default async function NewEquipmentPage(props: LocaleParams) {
  const locale = await resolveLocale(props);
  const [t, membership, subject] = await Promise.all([
    getTranslations('Equipment'),
    getCurrentMembership(),
    getSubject(),
  ]);
  if (!membership || !subject) redirectNow('/dashboard', locale);

  const decision = can(subject, 'equipment:create', { departmentId: subject.departmentId });
  const departments = await listDepartments(membership.organization.id);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Link href="/equipment" className="text-sm text-ink-muted">
        {t('back')}
      </Link>
      <h1 className="text-4xl font-semibold">{t('form.createTitle')}</h1>
      {decision.allowed ? (
        <div className="card p-6">
          <EquipmentForm
            id={null}
            defaults={{
              name: '',
              category: 'camera',
              status: 'available',
              departmentId: subject.departmentId,
              assetTag: '',
              notes: '',
            }}
            departments={departments}
            lockedDepartmentId={subject.role === 'department_lead' ? subject.departmentId : null}
            readOnly={false}
          />
        </div>
      ) : (
        <DeniedNotice decision={decision} />
      )}
    </div>
  );
}
