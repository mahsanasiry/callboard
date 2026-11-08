import { notFound } from 'next/navigation';
import * as rootParams from 'next/root-params';
import { getRequestConfig } from 'next-intl/server';
import { isLocale } from './locales';

export default getRequestConfig(async () => {
  const locale = await rootParams.locale();
  if (!isLocale(locale)) notFound();

  const messages = (await import(`../../messages/${locale}.json`)) as { default: object };
  return { locale, messages: messages.default };
});
