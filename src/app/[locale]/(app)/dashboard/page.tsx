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
      <div className="card mx-auto flex max-w-lg flex-col gap-6 p-6 sm:p-8">
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

  const STATUS_COLOR = {
    planning: 'var(--ds-ink-subtle)',
    scheduled: 'var(--ds-accent)',
    shooting: 'var(--ds-success)',
    wrapped: 'var(--ds-ink-muted)',
    archived: 'var(--ds-ink-subtle)',
  } as const;

  return (
    <div className="flex flex-col gap-12">
      <section
        className="card flex flex-col gap-4 p-6 sm:p-8"
        style={{
          backgroundImage: 'linear-gradient(135deg, var(--ds-accent-soft), var(--ds-surface) 60%)',
        }}
      >
        <p className="text-sm text-ink-muted">{membership.organization.name}</p>
        <h1 className="text-4xl font-semibold sm:text-5xl">
          {displayName ? t('welcome', { name: displayName }) : t('welcomeNoName')}
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <span className="badge">
            <span className="dot" style={{ color: 'var(--ds-accent)' }} aria-hidden="true" />
            <span className="font-normal text-ink-muted">{t('role')}</span>
            {roles(membership.role)}
          </span>
        </div>
        <p className="max-w-prose text-lg text-ink-muted">{summaries(membership.role)}</p>
      </section>

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
          <ul className="grid gap-4 sm:grid-cols-2">
            {productions.map((production) => (
              <li key={production.id} className="card flex flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-display text-xl font-semibold">{production.name}</p>
                  <span className="badge shrink-0">
                    <span
                      className="dot"
                      style={{ color: STATUS_COLOR[production.status] }}
                      aria-hidden="true"
                    />
                    {t(`productions.status.${production.status}`)}
                  </span>
                </div>
                <p className="flex items-center gap-2 text-sm text-ink-muted">
                  <svg
                    viewBox="0 0 24 24"
                    className="size-4 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="3" y="5" width="18" height="16" rx="2" />
                    <path d="M3 10h18M8 3v4M16 3v4" />
                  </svg>
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
