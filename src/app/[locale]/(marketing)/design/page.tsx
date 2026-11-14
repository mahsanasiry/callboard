import { getTranslations } from 'next-intl/server';
import { ThemeControls } from '@/components/theme/theme-controls';
import { resolveLocale, type LocaleParams } from '@/i18n/resolve-locale';

const COLOR_TOKENS = [
  'canvas',
  'surface',
  'sunken',
  'line',
  'line-strong',
  'ink',
  'ink-muted',
  'ink-subtle',
  'accent',
  'accent-fg',
  'danger',
  'warning',
  'success',
] as const;

const TYPE_SCALE = [
  { token: 'text-xs', className: 'text-xs' },
  { token: 'text-sm', className: 'text-sm' },
  { token: 'text-base', className: 'text-base' },
  { token: 'text-lg', className: 'text-lg' },
  { token: 'text-xl', className: 'text-xl' },
  { token: 'text-2xl', className: 'text-2xl' },
  { token: 'text-3xl', className: 'text-3xl' },
] as const;

const RADII = [
  { token: 'radius-sm', className: 'rounded-sm' },
  { token: 'radius-md', className: 'rounded-md' },
  { token: 'radius-lg', className: 'rounded-lg' },
  { token: 'radius-xl', className: 'rounded-xl' },
] as const;

export async function generateMetadata(props: LocaleParams) {
  const locale = await resolveLocale(props);
  const t = await getTranslations({ locale, namespace: 'Design' });
  return { title: t('title') };
}

export default async function DesignPage(props: LocaleParams) {
  await resolveLocale(props);
  const t = await getTranslations('Design');

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-14 px-5 py-12">
      <header className="flex max-w-prose flex-col gap-4">
        <h1 className="text-4xl font-semibold">{t('title')}</h1>
        <p className="text-lg text-ink-muted">{t('intro')}</p>
      </header>

      <section aria-labelledby="preferences" className="flex flex-col gap-5">
        <h2 id="preferences" className="text-2xl font-semibold">
          {t('preferences')}
        </h2>
        <div className="card p-5">
          <ThemeControls />
        </div>
      </section>

      <section aria-labelledby="colors" className="flex flex-col gap-5">
        <h2 id="colors" className="text-2xl font-semibold">
          {t('colors')}
        </h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {COLOR_TOKENS.map((token) => (
            <li
              key={token}
              className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-3"
            >
              <span
                className="block h-14 rounded-md border border-line-strong"
                style={{ background: `var(--ds-${token})` }}
              />
              <code className="text-xs text-ink-muted" dir="ltr">
                --ds-{token}
              </code>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="typography" className="flex flex-col gap-5">
        <h2 id="typography" className="text-2xl font-semibold">
          {t('typography')}
        </h2>
        <div className="card flex flex-col gap-6 p-5">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-ink-subtle">{t('displayFace')}</span>
            <p className="font-display text-3xl font-semibold">{t('typographySample')}</p>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm text-ink-subtle">{t('interfaceFace')}</span>
            <p className="text-lg">{t('typographySample')}</p>
          </div>
          <ul className="flex flex-col gap-2">
            {TYPE_SCALE.map(({ token, className }) => (
              <li key={token} className="flex items-baseline gap-4">
                <code className="w-20 shrink-0 text-xs text-ink-subtle" dir="ltr">
                  {token}
                </code>
                <span className={className}>{t('typographySample')}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="radius" className="flex flex-col gap-5">
        <h2 id="radius" className="text-2xl font-semibold">
          {t('radius')}
        </h2>
        <ul className="flex flex-wrap gap-4">
          {RADII.map(({ token, className }) => (
            <li key={token} className="flex flex-col items-start gap-2">
              <span
                className={`block size-20 border-2 border-line-strong bg-surface ${className}`}
              />
              <code className="text-xs text-ink-muted" dir="ltr">
                {token}
              </code>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="controls" className="flex flex-col gap-5">
        <h2 id="controls" className="text-2xl font-semibold">
          {t('controls')}
        </h2>
        <div className="flex flex-wrap items-end gap-4">
          <button type="button" className="button">
            {t('primaryAction')}
          </button>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink-muted">{t('textField')}</span>
            <input type="text" className="control" />
          </label>
        </div>
      </section>
    </div>
  );
}
