import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { SiteHeader } from '@/components/layout/site-header';
import { ThemeInitScript } from '@/components/theme/theme-init-script';
import { ThemeSync } from '@/components/theme/theme-sync';
import { LOCALES, locales } from '@/i18n/locales';
import { resolveLocale } from '@/i18n/resolve-locale';
import { fontVariablesFor } from '@/lib/fonts';
import { siteUrl } from '@/lib/site';
import '../globals.css';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata(props: Pick<LayoutProps, 'params'>): Promise<Metadata> {
  const locale = await resolveLocale(props);
  const t = await getTranslations({ locale, namespace: 'Meta' });

  return {
    metadataBase: new URL(siteUrl),
    title: { default: t('title'), template: `%s · ${t('title')}` },
    description: t('description'),
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(locales.map((code) => [code, `/${code}`])),
    },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const locale = await resolveLocale({ params });

  const { direction, script } = LOCALES[locale];
  const [t, fontVariables] = await Promise.all([
    getTranslations('Common'),
    fontVariablesFor(script),
  ]);

  return (
    <html
      lang={locale}
      dir={direction}
      data-script={script}
      className={fontVariables}
      suppressHydrationWarning
    >
      <body>
        <ThemeInitScript />
        <NextIntlClientProvider>
          <a href="#main-content" className="skip-link">
            {t('skipToContent')}
          </a>
          <ThemeSync />
          <SiteHeader />
          <main id="main-content">{children}</main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
