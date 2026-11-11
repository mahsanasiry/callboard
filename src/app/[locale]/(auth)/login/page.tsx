import { getTranslations } from 'next-intl/server';
import { AuthCard } from '@/components/ui/auth-card';
import { DemoSignIn } from '@/features/auth/components/demo-sign-in';
import { LoginForm } from '@/features/auth/components/login-form';
import { DEMO_ROLES, readDemoConfig } from '@/features/auth/demo';
import { FORM_ERROR_KEYS, type FormErrorKey } from '@/features/auth/result';
import { Link } from '@/i18n/navigation';
import { resolveLocale, type LocaleParams } from '@/i18n/resolve-locale';
import { safeNextPath } from '@/lib/auth/access';

interface PageProps extends LocaleParams {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata(props: LocaleParams) {
  const locale = await resolveLocale(props);
  const t = await getTranslations({ locale, namespace: 'Auth.login' });
  return { title: t('title') };
}

function single(value: string | string[] | undefined): string | null {
  return typeof value === 'string' ? value : null;
}

export default async function LoginPage(props: PageProps) {
  await resolveLocale(props);
  const t = await getTranslations('Auth');
  const query = await props.searchParams;
  const reason = single(query.error);
  const initialError: FormErrorKey | null = FORM_ERROR_KEYS.find((key) => key === reason) ?? null;
  const demoEnabled = readDemoConfig() !== null;

  return (
    <div
      className={`mx-auto flex w-full max-w-md flex-col gap-8 ${demoEnabled ? 'lg:grid lg:max-w-4xl lg:grid-cols-2 lg:items-start' : ''}`}
    >
      <AuthCard
        title={t('login.title')}
        intro={t('login.intro')}
        footer={
          <p className="text-ink-muted">
            {t('login.noAccount')}{' '}
            <Link href="/signup" className="font-medium text-accent">
              {t('login.createAccount')}
            </Link>
          </p>
        }
      >
        <LoginForm next={safeNextPath(single(query.next))} initialError={initialError} />
      </AuthCard>
      {demoEnabled ? (
        <div className="rounded-xl border border-line bg-surface p-6">
          <DemoSignIn roles={DEMO_ROLES} />
        </div>
      ) : null}
    </div>
  );
}
