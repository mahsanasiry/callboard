import { notFound } from 'next/navigation';
import { isLocale, type Locale } from './locales';

export interface LocaleParams {
  params: Promise<{ locale: string }>;
}

export async function resolveLocale({ params }: LocaleParams): Promise<Locale> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return locale;
}
