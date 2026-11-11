import { useTranslations } from 'next-intl';

export function Wordmark() {
  const t = useTranslations('Common');

  return (
    <span className="inline-flex items-center gap-2.5">
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none">
        <rect x="2" y="7" width="20" height="14" rx="3" fill="var(--ds-accent)" />
        <path
          d="M3 3.5 21 6.5M7.5 4.3l2.4 3.4M12.7 5.2l2.4 3.4"
          stroke="var(--ds-ink)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <span className="font-display text-xl font-semibold" dir="ltr">
        {t('appName')}
      </span>
    </span>
  );
}
