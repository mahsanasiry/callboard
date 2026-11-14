import { getTranslations } from 'next-intl/server';
import { AuthCard } from '@/components/ui/auth-card';
import { AcceptInvitationForm } from '@/features/members/components/accept-invitation-form';
import { resolveLocale, type LocaleParams } from '@/i18n/resolve-locale';

interface PageProps extends LocaleParams {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata(props: LocaleParams) {
  const locale = await resolveLocale(props);
  const t = await getTranslations({ locale, namespace: 'Invite' });
  return { title: t('title') };
}

export default async function InvitePage(props: PageProps) {
  await resolveLocale(props);
  const t = await getTranslations('Invite');
  const { token } = await props.searchParams;
  const value = typeof token === 'string' ? token : null;

  return (
    <AuthCard title={t('title')} intro={value ? t('body') : t('missing')}>
      {value ? <AcceptInvitationForm token={value} /> : null}
    </AuthCard>
  );
}
