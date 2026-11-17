import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ArchiveControls } from '@/components/ui/archive-controls';
import { archiveEquipmentAction, restoreEquipmentAction } from '@/features/equipment/actions';
import { EquipmentForm } from '@/features/equipment/components/equipment-form';
import { EQUIPMENT_CATEGORIES, EQUIPMENT_STATUSES } from '@/features/equipment/config';
import { getEquipment } from '@/features/equipment/queries';
import { idSchema } from '@/features/equipment/schemas';
import { listDepartments } from '@/features/members/queries';
import { getCurrentMembership } from '@/features/organizations/queries';
import { Link } from '@/i18n/navigation';
import { redirectNow } from '@/i18n/redirect-now';
import { resolveLocale } from '@/i18n/resolve-locale';
import { DeniedNotice } from '@/lib/permissions/notice';
import { can } from '@/lib/permissions/policy';
import { getSubject } from '@/lib/permissions/server';

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata(props: PageProps) {
  const locale = await resolveLocale(props);
  const t = await getTranslations({ locale, namespace: 'Equipment.form' });
  return { title: t('editTitle') };
}

function pick<T extends string>(options: readonly T[], value: string, fallback: T): T {
  return options.find((option) => option === value) ?? fallback;
}

export default async function EditEquipmentPage(props: PageProps) {
  const locale = await resolveLocale(props);
  const { id } = await props.params;
  if (!idSchema.safeParse({ id }).success) notFound();

  const [t, membership, subject, item] = await Promise.all([
    getTranslations('Equipment'),
    getCurrentMembership(),
    getSubject(),
    getEquipment(id),
  ]);
  if (!membership || !subject) redirectNow('/dashboard', locale);
  if (!item) notFound();

  const departments = await listDepartments(membership.organization.id);
  const context = { departmentId: item.department_id };
  const update = can(subject, 'equipment:update', context);
  const remove = can(subject, 'equipment:delete', context);
  const archived = item.deleted_at !== null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Link href="/equipment" className="text-sm text-ink-muted">
        {t('back')}
      </Link>
      <h1 className="text-4xl font-semibold">{item.name}</h1>
      <div className="card flex flex-col gap-6 p-6">
        <EquipmentForm
          id={item.id}
          defaults={{
            name: item.name,
            category: pick(EQUIPMENT_CATEGORIES, item.category, 'other'),
            status: pick(EQUIPMENT_STATUSES, item.status, 'available'),
            departmentId: item.department_id,
            assetTag: item.asset_tag ?? '',
            notes: item.notes,
          }}
          departments={departments}
          lockedDepartmentId={subject.role === 'department_lead' ? subject.departmentId : null}
          readOnly={!update.allowed || archived}
        />
        {!update.allowed ? <DeniedNotice decision={update} /> : null}
        <ArchiveControls
          archived={archived}
          canArchive={remove.allowed}
          canRestore={update.allowed}
          labels={{
            button: t('archive.button'),
            dialogTitle: t('archive.title', { name: item.name }),
            dialogBody: t('archive.body'),
            confirm: t('archive.confirm'),
            working: t('archive.working'),
            cancel: t('archive.cancel'),
            isArchived: t('archive.isArchived'),
            restore: t('archive.restore'),
            restoring: t('archive.restoring'),
          }}
          onArchive={archiveEquipmentAction.bind(null, item.id, locale)}
          onRestore={restoreEquipmentAction.bind(null, item.id, locale)}
        />
      </div>
    </div>
  );
}
