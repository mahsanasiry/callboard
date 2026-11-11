import { getTranslations } from 'next-intl/server';
import { AuthCard } from '@/components/ui/auth-card';
import { Link } from '@/i18n/navigation';
import { resolveLocale, type LocaleParams } from '@/i18n/resolve-locale';

interface PageProps extends LocaleParams {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata(props: LocaleParams) {
  const locale = await resolveLocale(props);
  const t = await getTranslations({ locale, namespace: 'Auth.checkEmail' });
  return { title: t('title') };
}

export default async function CheckEmailPage(props: PageProps) {
  await resolveLocale(props);
  const t = await getTranslations('Auth.checkEmail');
  const { reason } = await props.searchParams;

  return (
    <AuthCard title={t('title')} intro={reason === 'signup' ? t('signup') : t('recovery')}>
      <Link href="/login" className="font-medium text-accent">
        {t('back')}
      </Link>
    </AuthCard>
  );
}
