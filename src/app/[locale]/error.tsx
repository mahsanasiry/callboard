'use client';

import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RouteError({ error, reset }: ErrorProps) {
  const t = useTranslations('Errors');

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="main-content" className="mx-auto max-w-xl px-5 py-24">
      <div role="alert" className="flex flex-col items-start gap-5">
        <h1 className="text-4xl font-semibold">{t('title')}</h1>
        <p className="text-lg text-ink-muted">{t('body')}</p>
        <button type="button" className="button" onClick={reset}>
          {t('retry')}
        </button>
      </div>
    </main>
  );
}
