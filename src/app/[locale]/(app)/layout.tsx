import { AppShell } from '@/components/app/app-shell';
import {
  getCurrentMembership,
  getCurrentUser,
  getDisplayName,
} from '@/features/organizations/queries';
import { redirect } from '@/i18n/navigation';
import { resolveLocale, type LocaleParams } from '@/i18n/resolve-locale';

// Every page here depends on the signed-in person, so none of it can be built ahead of time.
export const dynamic = 'force-dynamic';

interface AppLayoutProps extends LocaleParams {
  children: React.ReactNode;
}

export default async function AppLayout({ children, params }: AppLayoutProps) {
  const locale = await resolveLocale({ params });
  const user = await getCurrentUser();
  if (!user) redirect({ href: '/login', locale });

  const [membership, displayName] = await Promise.all([
    getCurrentMembership(),
    user ? getDisplayName(user.id) : Promise.resolve(''),
  ]);

  return (
    <AppShell
      displayName={displayName}
      email={user?.email ?? ''}
      role={membership?.role ?? null}
      organizationName={membership?.organization.name ?? null}
    >
      {children}
    </AppShell>
  );
}
