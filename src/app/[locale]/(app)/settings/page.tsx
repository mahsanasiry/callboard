import { getTranslations } from 'next-intl/server';
import { ThemeControls } from '@/components/theme/theme-controls';
import { NotificationsForm } from '@/features/settings/components/notifications-form';
import { PasswordForm } from '@/features/settings/components/password-form';
import { DeleteAccountForm } from '@/features/settings/components/delete-account-form';
import { ProfileForm } from '@/features/settings/components/profile-form';
import { getCurrentUser } from '@/features/organizations/queries';
import { getProfileSettings } from '@/features/settings/queries';
import { isLocale } from '@/i18n/locales';
import { redirectNow } from '@/i18n/redirect-now';
import { resolveLocale, type LocaleParams } from '@/i18n/resolve-locale';

export async function generateMetadata(props: LocaleParams) {
  const locale = await resolveLocale(props);
  const t = await getTranslations({ locale, namespace: 'Settings' });
  return { title: t('title') };
}

function availableTimeZones(current: string): string[] {
  const zones = new Set(Intl.supportedValuesOf('timeZone'));
  zones.add('UTC');
  zones.add(current);
  return [...zones].sort();
}

function Section({
  id,
  title,
  intro,
  children,
}: {
  id: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="card flex flex-col gap-5 p-6">
      <div className="flex flex-col gap-1">
        <h2 id={id} className="text-2xl font-semibold">
          {title}
        </h2>
        {intro ? <p className="text-ink-muted">{intro}</p> : null}
      </div>
      {children}
    </section>
  );
}

export default async function SettingsPage(props: LocaleParams) {
  const locale = await resolveLocale(props);
  const t = await getTranslations('Settings');

  const user = await getCurrentUser();
  if (!user) redirectNow('/login', locale);
  const profile = await getProfileSettings(user.id);
  if (!profile) redirectNow('/login', locale);

  const defaults = {
    displayName: profile.displayName,
    locale: isLocale(profile.locale) ? profile.locale : locale,
    timeZone: profile.timeZone,
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <h1 className="text-4xl font-semibold">{t('title')}</h1>
      <Section id="profile-heading" title={t('profile.title')}>
        <ProfileForm defaults={defaults} timeZones={availableTimeZones(defaults.timeZone)} />
      </Section>
      <Section id="appearance-heading" title={t('appearance.title')} intro={t('appearance.intro')}>
        <ThemeControls />
      </Section>
      <Section id="notifications-heading" title={t('notifications.title')}>
        <NotificationsForm defaults={profile.notifications} />
      </Section>
      <Section id="security-heading" title={t('security.title')} intro={t('security.intro')}>
        <PasswordForm disabled={profile.isDemo} />
      </Section>
      <Section id="danger-heading" title={t('danger.title')} intro={t('danger.intro')}>
        <DeleteAccountForm email={user.email ?? ''} disabled={profile.isDemo} />
      </Section>
    </div>
  );
}
