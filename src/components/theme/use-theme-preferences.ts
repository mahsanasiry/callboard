'use client';

import { useCallback, useSyncExternalStore } from 'react';
import {
  getPreferencesSnapshot,
  getServerPreferencesSnapshot,
  savePreferences,
  subscribeToPreferences,
} from '@/lib/theme/store';
import type { ThemePreferences } from '@/lib/theme/preferences';

export function useThemePreferences(): [
  ThemePreferences,
  (patch: Partial<ThemePreferences>) => void,
] {
  const preferences = useSyncExternalStore(
    subscribeToPreferences,
    getPreferencesSnapshot,
    getServerPreferencesSnapshot,
  );

  const update = useCallback(
    (patch: Partial<ThemePreferences>) => {
      savePreferences({ ...preferences, ...patch });
    },
    [preferences],
  );

  return [preferences, update];
}
