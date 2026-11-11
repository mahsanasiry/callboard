import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export default async function NotFound() {
  const t = await getTranslations();

  return (
    <main id="main-content" className="mx-auto flex max-w-xl flex-col items-start gap-5 px-5 py-24">
      <h1 className="text-4xl font-semibold">{t('Errors.notFoundTitle')}</h1>
      <p className="text-lg text-ink-muted">{t('Errors.notFoundBody')}</p>
      <Link href="/" className="button">
        {t('Common.backHome')}
      </Link>
    </main>
  );
}
