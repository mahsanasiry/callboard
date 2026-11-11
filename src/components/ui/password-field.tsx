'use client';

import { useTranslations } from 'next-intl';
import { useState, type ComponentProps } from 'react';
import { TextField } from './text-field';

type PasswordFieldProps = Omit<ComponentProps<typeof TextField>, 'type' | 'trailing'>;

export function PasswordField(props: PasswordFieldProps) {
  const t = useTranslations('Auth');
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      {...props}
      type={visible ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          onClick={() => {
            setVisible((current) => !current);
          }}
          aria-pressed={visible}
          className="inline-flex min-h-9 items-center rounded-md px-2 text-sm text-ink-muted hover:text-ink"
        >
          {visible ? t('hidePassword') : t('showPassword')}
        </button>
      }
    />
  );
}
