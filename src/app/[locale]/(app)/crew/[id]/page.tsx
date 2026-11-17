import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ArchiveControls } from '@/components/ui/archive-controls';
import { archiveCrewAction, restoreCrewAction } from '@/features/crew/actions';
import { CrewForm } from '@/features/crew/components/crew-form';
import { getCrewMember } from '@/features/crew/queries';
import { crewIdSchema } from '@/features/crew/schemas';
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
  const t = await getTranslations({ locale, namespace: 'Crew.form' });
  return { title: t('editTitle') };
}

export default async function EditCrewPage(props: PageProps) {
  const locale = await resolveLocale(props);
  const { id } = await props.params;
  if (!crewIdSchema.safeParse({ id }).success) notFound();

  const [t, membership, subject, person] = await Promise.all([
    getTranslations('Crew'),
    getCurrentMembership(),
    getSubject(),
    getCrewMember(id),
  ]);
  if (!membership || !subject) redirectNow('/dashboard', locale);
  if (!person) notFound();

  const departments = await listDepartments(membership.organization.id);
  const update = can(subject, 'crewMember:update', { ownerUserId: person.user_id });
  const remove = can(subject, 'crewMember:delete');
  const archived = person.deleted_at !== null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Link href="/crew" className="text-sm text-ink-muted">
        {t('back')}
      </Link>
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl font-semibold">{person.full_name}</h1>
        {person.user_id ? <p className="text-ink-muted">{t('hasAccount')}</p> : null}
      </div>
      <div className="card flex flex-col gap-6 p-6">
        <CrewForm
          id={person.id}
          defaults={{
            fullName: person.full_name,
            roleTitle: person.role_title,
            departmentId: person.department_id,
            email: person.email ?? '',
            phone: person.phone ?? '',
            preferredLocale: person.preferred_locale,
            notes: person.notes,
          }}
          departments={departments}
          readOnly={!update.allowed || archived}
        />
        {!update.allowed ? <DeniedNotice decision={update} /> : null}
        <ArchiveControls
          archived={archived}
          canArchive={remove.allowed}
          canRestore={update.allowed}
          labels={{
            button: t('archive.button'),
            dialogTitle: t('archive.title', { name: person.full_name }),
            dialogBody: t('archive.body'),
            confirm: t('archive.confirm'),
            working: t('archive.working'),
            cancel: t('archive.cancel'),
            isArchived: t('archive.isArchived'),
            restore: t('archive.restore'),
            restoring: t('archive.restoring'),
          }}
          onArchive={archiveCrewAction.bind(null, person.id, locale)}
          onRestore={restoreCrewAction.bind(null, person.id, locale)}
        />
      </div>
    </div>
  );
}
