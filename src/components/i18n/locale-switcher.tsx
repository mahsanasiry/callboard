'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { LOCALES, locales, isLocale } from '@/i18n/locales';
import { usePathname, useRouter } from '@/i18n/navigation';

export function LocaleSwitcher() {
  const t = useTranslations('Common');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function handleChange(next: string) {
    if (!isLocale(next)) return;
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <span className="sr-only text-ink-muted sm:not-sr-only">{t('language')}</span>
      <select
        value={locale}
        disabled={isPending}
        onChange={(event) => {
          handleChange(event.target.value);
        }}
        className="control"
      >
        {locales.map((code) => (
          <option key={code} value={code} lang={code} dir={LOCALES[code].direction}>
            {LOCALES[code].nativeName}
          </option>
        ))}
      </select>
    </label>
  );
}
