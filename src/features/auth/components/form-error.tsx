'use client';

import { useTranslations } from 'next-intl';
import type { FormErrorKey } from '../result';

export function FormError({ error }: { error: FormErrorKey | null }) {
  const t = useTranslations('Auth.errors');
  if (!error) return null;
  return (
    <div role="alert" className="notice notice-danger">
      {t(error)}
    </div>
  );
}
