import { useTranslations } from 'next-intl';
import { LocaleSwitcher } from '@/components/i18n/locale-switcher';
import { Link } from '@/i18n/navigation';
import { Wordmark } from './wordmark';

export function SiteHeader() {
  const t = useTranslations('Common');

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-5">
        <Link href="/" className="no-underline">
          <Wordmark />
        </Link>
        <nav aria-label={t('mainNavigation')} className="flex items-center gap-3 sm:gap-5">
          <Link href="/design" className="text-sm whitespace-nowrap text-ink-muted hover:text-ink">
            {t('designSystem')}
          </Link>
          <Link href="/login" className="text-sm font-medium whitespace-nowrap">
            {t('signIn')}
          </Link>
          <LocaleSwitcher />
        </nav>
      </div>
    </header>
  );
}
