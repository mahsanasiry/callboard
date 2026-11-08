'use client';

import { useTranslations } from 'next-intl';
import { ACCENTS, DENSITIES, MOTIONS, THEME_MODES } from '@/lib/theme/preferences';
import { useThemePreferences } from './use-theme-preferences';

interface OptionGroupProps<T extends string> {
  legend: string;
  name: string;
  options: readonly T[];
  value: T;
  labelFor: (option: T) => string;
  onChange: (option: T) => void;
}

function OptionGroup<T extends string>({
  legend,
  name,
  options,
  value,
  labelFor,
  onChange,
}: OptionGroupProps<T>) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-medium text-ink-muted">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label key={option} className="choice">
            <input
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              onChange={() => {
                onChange(option);
              }}
              className="sr-only"
            />
            <span>{labelFor(option)}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function ThemeControls() {
  const t = useTranslations('Theme');
  const [preferences, update] = useThemePreferences();

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <OptionGroup
        legend={t('mode.label')}
        name="theme-mode"
        options={THEME_MODES}
        value={preferences.mode}
        labelFor={(option) => t(`mode.${option}`)}
        onChange={(mode) => {
          update({ mode });
        }}
      />
      <OptionGroup
        legend={t('accent.label')}
        name="theme-accent"
        options={ACCENTS}
        value={preferences.accent}
        labelFor={(option) => t(`accent.${option}`)}
        onChange={(accent) => {
          update({ accent });
        }}
      />
      <OptionGroup
        legend={t('density.label')}
        name="theme-density"
        options={DENSITIES}
        value={preferences.density}
        labelFor={(option) => t(`density.${option}`)}
        onChange={(density) => {
          update({ density });
        }}
      />
      <OptionGroup
        legend={t('motion.label')}
        name="theme-motion"
        options={MOTIONS}
        value={preferences.motion}
        labelFor={(option) => t(`motion.${option}`)}
        onChange={(motion) => {
          update({ motion });
        }}
      />
    </div>
  );
}
