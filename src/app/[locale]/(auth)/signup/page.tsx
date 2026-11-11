import { getTranslations } from 'next-intl/server';
import { AuthCard } from '@/components/ui/auth-card';
import { SignupForm } from '@/features/auth/components/signup-form';
import { Link } from '@/i18n/navigation';
import { resolveLocale, type LocaleParams } from '@/i18n/resolve-locale';

export async function generateMetadata(props: LocaleParams) {
  const locale = await resolveLocale(props);
  const t = await getTranslations({ locale, namespace: 'Auth.signup' });
  return { title: t('title') };
}

export default async function SignupPage(props: LocaleParams) {
  await resolveLocale(props);
  const t = await getTranslations('Auth');

  return (
    <AuthCard
      title={t('signup.title')}
      intro={t('signup.intro')}
      footer={
        <p className="text-ink-muted">
          {t('signup.haveAccount')}{' '}
          <Link href="/login" className="font-medium text-accent">
            {t('signup.signIn')}
          </Link>
        </p>
      }
    >
      <SignupForm />
    </AuthCard>
  );
}
