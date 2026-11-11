import { useTranslations } from 'next-intl';
import { LocaleSwitcher } from '@/components/i18n/locale-switcher';
import { Wordmark } from '@/components/layout/wordmark';
import { Link } from '@/i18n/navigation';
import type { Role } from '@/lib/permissions/policy';
import { UserMenu } from './user-menu';

interface AppShellProps {
  displayName: string;
  email: string;
  role: Role | null;
  organizationName: string | null;
  children: React.ReactNode;
}

export function AppShell({ displayName, email, role, organizationName, children }: AppShellProps) {
  const t = useTranslations('App');
  const roles = useTranslations('Roles');

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-line bg-canvas/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-5">
          <div className="flex min-w-0 items-center gap-4 sm:gap-6">
            <Link href="/dashboard" className="no-underline">
              <Wordmark />
            </Link>
            <nav aria-label={t('nav.label')}>
              <Link
                href="/dashboard"
                aria-current="page"
                className="border-b-2 border-accent py-1 text-sm font-medium no-underline"
              >
                {t('nav.dashboard')}
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {organizationName ? (
              <span className="hidden max-w-48 truncate text-sm text-ink-muted md:inline">
                {organizationName}
              </span>
            ) : null}
            <LocaleSwitcher />
            <UserMenu displayName={displayName} email={email} roleLabel={role ? roles(role) : ''} />
          </div>
        </div>
      </header>
      <main id="main-content" className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-5">
        {children}
      </main>
    </>
  );
}
