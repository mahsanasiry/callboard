'use client';

import { useEffect } from 'react';
import { applyStoredPreferences } from '@/lib/theme/store';

/** Re-applies the stored theme after hydration and keeps it in step with system changes. */
export function ThemeSync() {
  useEffect(() => {
    applyStoredPreferences();
  }, []);

  return null;
}
