import {
  applyResolvedTheme,
  DEFAULT_PREFERENCES,
  parsePreferences,
  resolvePreferences,
  THEME_STORAGE_KEY,
  type SystemSignals,
  type ThemePreferences,
} from './preferences';

const CHANGE_EVENT = 'callboard:theme-change';

let cachedRaw: string | null = null;
let cachedPreferences: ThemePreferences = DEFAULT_PREFERENCES;

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function getSystemSignals(): SystemSignals {
  return {
    prefersDark: window.matchMedia('(prefers-color-scheme: dark)').matches,
    prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  };
}

export function getPreferencesSnapshot(): ThemePreferences {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedPreferences = parsePreferences(raw);
  }
  return cachedPreferences;
}

export function getServerPreferencesSnapshot(): ThemePreferences {
  return DEFAULT_PREFERENCES;
}

export function applyStoredPreferences(): void {
  applyResolvedTheme(
    document.documentElement,
    resolvePreferences(getPreferencesSnapshot(), getSystemSignals()),
  );
}

export function savePreferences(preferences: ThemePreferences): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Storage can be unavailable (private mode); the choice still applies for this visit.
    cachedRaw = null;
    cachedPreferences = preferences;
  }
  applyResolvedTheme(document.documentElement, resolvePreferences(preferences, getSystemSignals()));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeToPreferences(onChange: () => void): () => void {
  const colorQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const handleSystemChange = () => {
    applyStoredPreferences();
    onChange();
  };

  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener('storage', handleSystemChange);
  colorQuery.addEventListener('change', handleSystemChange);
  motionQuery.addEventListener('change', handleSystemChange);

  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener('storage', handleSystemChange);
    colorQuery.removeEventListener('change', handleSystemChange);
    motionQuery.removeEventListener('change', handleSystemChange);
  };
}
