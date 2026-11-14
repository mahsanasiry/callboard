import { useTranslations } from 'next-intl';
import { LocaleSwitcher } from '@/components/i18n/locale-switcher';
import { ThemeMenu } from '@/components/theme/theme-menu';
import { Wordmark } from '@/components/layout/wordmark';
import { Link } from '@/i18n/navigation';
import { AppBottomNav, AppNav } from './app-nav';
import type { Role } from '@/lib/permissions/policy';
import { UserMenu } from './user-menu';

interface AppShellProps {
  displayName: string;
  email: string;
  role: Role | null;
  organizationName: string | null;
  canSeeMembers: boolean;
  children: React.ReactNode;
}

export function AppShell({
  displayName,
  email,
  role,
  organizationName,
  canSeeMembers,
  children,
}: AppShellProps) {
  const t = useTranslations('App');
  const roles = useTranslations('Roles');

  const items = [
    { href: '/dashboard' as const, label: t('nav.dashboard') },
    ...(canSeeMembers ? [{ href: '/members' as const, label: t('nav.members') }] : []),
    { href: '/settings' as const, label: t('nav.settings') },
  ];

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-line bg-canvas/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-4 sm:gap-6">
            <Link href="/dashboard" className="no-underline">
              <Wordmark />
            </Link>
            <AppNav label={t('nav.label')} items={items} />
          </div>
          <div className="flex items-center gap-3">
            {organizationName ? (
              <span className="hidden max-w-48 truncate rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-ink-muted md:inline">
                {organizationName}
              </span>
            ) : null}
            <LocaleSwitcher />
            <ThemeMenu />
            <UserMenu displayName={displayName} email={email} roleLabel={role ? roles(role) : ''} />
          </div>
        </div>
      </header>
      <main
        id="main-content"
        className="mx-auto w-full max-w-6xl px-4 pt-6 pb-28 sm:px-5 sm:pt-8 sm:pb-12"
      >
        {children}
      </main>
      <AppBottomNav label={t('nav.label')} items={items} />
    </>
  );
}
