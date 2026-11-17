import { getTranslations } from 'next-intl/server';
import { EquipmentList } from '@/features/equipment/components/equipment-list';
import { equipmentListConfig } from '@/features/equipment/config';
import { listEquipment } from '@/features/equipment/queries';
import { listDepartments } from '@/features/members/queries';
import { getCurrentMembership } from '@/features/organizations/queries';
import { Link } from '@/i18n/navigation';
import { redirectNow } from '@/i18n/redirect-now';
import { resolveLocale, type LocaleParams } from '@/i18n/resolve-locale';
import { parseListState } from '@/lib/list/state';
import { DeniedNotice } from '@/lib/permissions/notice';
import { can } from '@/lib/permissions/policy';
import { getSubject } from '@/lib/permissions/server';

interface PageProps extends LocaleParams {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata(props: LocaleParams) {
  const locale = await resolveLocale(props);
  const t = await getTranslations({ locale, namespace: 'Equipment' });
  return { title: t('title') };
}

function toSearchParams(query: Record<string, string | string[] | undefined>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) for (const item of value) params.append(key, item);
    else if (value !== undefined) params.set(key, value);
  }
  return params;
}

export default async function EquipmentPage(props: PageProps) {
  const locale = await resolveLocale(props);
  const [t, membership, subject, query] = await Promise.all([
    getTranslations('Equipment'),
    getCurrentMembership(),
    getSubject(),
    props.searchParams,
  ]);
  if (!membership) redirectNow('/dashboard', locale);

  const state = parseListState(toSearchParams(query), equipmentListConfig);
  const [{ rows, total }, departments] = await Promise.all([
    listEquipment(state),
    listDepartments(membership.organization.id),
  ]);

  const createDecision = can(subject, 'equipment:create', {
    departmentId: subject?.departmentId ?? null,
  });
  const canSeeArchive = membership.role === 'owner' || membership.role === 'producer';

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-semibold">{t('title')}</h1>
          <p className="max-w-prose text-ink-muted">{t('intro')}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {createDecision.allowed ? (
            <Link href="/equipment/new" className="button">
              {t('new')}
            </Link>
          ) : (
            <>
              <button type="button" className="button" disabled aria-disabled="true">
                {t('new')}
              </button>
              <DeniedNotice decision={createDecision} />
            </>
          )}
        </div>
      </header>
      <EquipmentList
        rows={rows}
        total={total}
        departments={departments}
        canSeeArchive={canSeeArchive}
      />
    </div>
  );
}
