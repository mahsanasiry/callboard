import { getTranslations } from 'next-intl/server';
import { ScheduleSketch } from '@/components/marketing/schedule-sketch';
import { Link } from '@/i18n/navigation';
import { resolveLocale, type LocaleParams } from '@/i18n/resolve-locale';

export default async function LandingPage(props: LocaleParams) {
  await resolveLocale(props);
  const t = await getTranslations('Landing');

  return (
    <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:py-24">
      <div className="flex flex-col items-start gap-6">
        <h1 className="text-4xl font-semibold sm:text-5xl lg:text-6xl">{t('title')}</h1>
        <p className="max-w-prose text-lg text-ink-muted">{t('lede')}</p>
        <Link href="/design" className="button">
          {t('cta')}
        </Link>
      </div>
      <ScheduleSketch />
    </div>
  );
}
