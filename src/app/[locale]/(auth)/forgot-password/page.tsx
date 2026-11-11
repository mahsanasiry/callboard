import { getTranslations } from 'next-intl/server';
import { AuthCard } from '@/components/ui/auth-card';
import { ForgotPasswordForm } from '@/features/auth/components/forgot-password-form';
import { Link } from '@/i18n/navigation';
import { resolveLocale, type LocaleParams } from '@/i18n/resolve-locale';

export async function generateMetadata(props: LocaleParams) {
  const locale = await resolveLocale(props);
  const t = await getTranslations({ locale, namespace: 'Auth.forgot' });
  return { title: t('title') };
}

export default async function ForgotPasswordPage(props: LocaleParams) {
  await resolveLocale(props);
  const t = await getTranslations('Auth.forgot');

  return (
    <AuthCard
      title={t('title')}
      intro={t('intro')}
      footer={
        <Link href="/login" className="font-medium text-accent">
          {t('back')}
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
