import { getFormatter, getTranslations } from 'next-intl/server';
import { CreateOrganizationForm } from '@/features/organizations/components/create-organization-form';
import { PermissionSummary } from '@/features/organizations/components/permission-summary';
import {
  getCurrentMembership,
  getCurrentUser,
  getDisplayName,
  listVisibleProductions,
} from '@/features/organizations/queries';
import { resolveLocale, type LocaleParams } from '@/i18n/resolve-locale';

export async function generateMetadata(props: LocaleParams) {
  const locale = await resolveLocale(props);
  const t = await getTranslations({ locale, namespace: 'Dashboard' });
  return { title: t('title') };
}

export default async function DashboardPage(props: LocaleParams) {
  await resolveLocale(props);
  const [t, format, user, membership] = await Promise.all([
    getTranslations('Dashboard'),
    getFormatter(),
    getCurrentUser(),
    getCurrentMembership(),
  ]);
  const displayName = user ? await getDisplayName(user.id) : '';

  if (!membership) {
    const onboarding = await getTranslations('Onboarding');
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-6 rounded-xl border border-line bg-surface p-6 shadow-raised sm:p-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold">{onboarding('title')}</h1>
          <p className="text-ink-muted">{onboarding('body')}</p>
        </div>
        <CreateOrganizationForm />
      </div>
    );
  }

  const [roles, summaries, productions] = await Promise.all([
    getTranslations('Roles'),
    getTranslations('RoleSummary'),
    listVisibleProductions(),
  ]);

  const formatDay = (value: string) =>
    format.dateTime(new Date(`${value}T00:00:00Z`), { dateStyle: 'medium', timeZone: 'UTC' });

  return (
    <div className="flex flex-col gap-12">
      <header className="flex flex-col gap-3">
        <h1 className="text-4xl font-semibold">
          {displayName ? t('welcome', { name: displayName }) : t('welcomeNoName')}
        </h1>
        <dl className="flex flex-wrap gap-x-8 gap-y-2 text-ink-muted">
          <div className="flex gap-2">
            <dt>{t('organization')}</dt>
            <dd className="font-medium text-ink">{membership.organization.name}</dd>
          </div>
          <div className="flex gap-2">
            <dt>{t('role')}</dt>
            <dd className="font-medium text-ink">{roles(membership.role)}</dd>
          </div>
        </dl>
        <p className="max-w-prose text-ink-muted">{summaries(membership.role)}</p>
      </header>

      <section aria-labelledby="productions-heading" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="productions-heading" className="text-2xl font-semibold">
            {t('productions.title')}
          </h2>
          <p className="text-ink-muted">{t('productions.count', { count: productions.length })}</p>
        </div>
        {productions.length === 0 ? (
          <p className="notice">{t('productions.empty')}</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {productions.map((production) => (
              <li
                key={production.id}
                className="flex flex-col gap-1 rounded-lg border border-line bg-surface p-4 shadow-raised"
              >
                <p className="text-lg font-semibold">{production.name}</p>
                <p className="text-sm text-ink-muted">
                  {t(`productions.status.${production.status}`)}
                </p>
                <p className="text-sm text-ink-subtle">
                  {production.starts_on && production.ends_on
                    ? t('productions.dates', {
                        start: formatDay(production.starts_on),
                        end: formatDay(production.ends_on),
                      })
                    : t('productions.noDates')}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="rbac-heading" className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 id="rbac-heading" className="text-2xl font-semibold">
            {t('rbac.title')}
          </h2>
          <p className="text-ink-muted">{t('rbac.intro')}</p>
        </div>
        <PermissionSummary role={membership.role} />
      </section>
    </div>
  );
}
