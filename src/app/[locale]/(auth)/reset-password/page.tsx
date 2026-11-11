import { getTranslations } from 'next-intl/server';
import { AuthCard } from '@/components/ui/auth-card';
import { ResetPasswordForm } from '@/features/auth/components/reset-password-form';
import { Link } from '@/i18n/navigation';
import { resolveLocale, type LocaleParams } from '@/i18n/resolve-locale';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function generateMetadata(props: LocaleParams) {
  const locale = await resolveLocale(props);
  const t = await getTranslations({ locale, namespace: 'Auth.reset' });
  return { title: t('title') };
}

export default async function ResetPasswordPage(props: LocaleParams) {
  await resolveLocale(props);
  const t = await getTranslations('Auth.reset');

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return (
      <AuthCard title={t('expiredTitle')} intro={t('expiredBody')}>
        <Link href="/forgot-password" className="button">
          {t('requestNew')}
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={t('title')}>
      <ResetPasswordForm />
    </AuthCard>
  );
}
