import { useTranslations } from 'next-intl';
import { LocaleSwitcher } from '@/components/i18n/locale-switcher';
import { Link } from '@/i18n/navigation';

function Wordmark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none">
      <rect x="2" y="7" width="20" height="14" rx="3" fill="var(--ds-accent)" />
      <path
        d="M3 3.5 21 6.5M7.5 4.3l2.4 3.4M12.7 5.2l2.4 3.4"
        stroke="var(--ds-ink)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SiteHeader() {
  const t = useTranslations('Common');

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <Link href="/" className="inline-flex items-center gap-2.5 no-underline">
          <Wordmark />
          <span className="font-display text-xl font-semibold" dir="ltr">
            {t('appName')}
          </span>
        </Link>
        <nav aria-label={t('mainNavigation')} className="flex items-center gap-5">
          <Link href="/design" className="text-sm text-ink-muted hover:text-ink">
            {t('designSystem')}
          </Link>
          <LocaleSwitcher />
        </nav>
      </div>
    </header>
  );
}
