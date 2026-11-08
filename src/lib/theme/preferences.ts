export const THEME_MODES = ['light', 'dark', 'system'] as const;
export const ACCENTS = ['cobalt', 'violet', 'teal', 'amber', 'rose'] as const;
export const DENSITIES = ['comfortable', 'compact'] as const;
export const MOTIONS = ['system', 'reduce', 'full'] as const;

export type ThemeMode = (typeof THEME_MODES)[number];
export type Accent = (typeof ACCENTS)[number];
export type Density = (typeof DENSITIES)[number];
export type MotionPreference = (typeof MOTIONS)[number];

export interface ThemePreferences {
  readonly mode: ThemeMode;
  readonly accent: Accent;
  readonly density: Density;
  readonly motion: MotionPreference;
}

export interface SystemSignals {
  readonly prefersDark: boolean;
  readonly prefersReducedMotion: boolean;
}

export interface ResolvedTheme {
  readonly theme: 'light' | 'dark';
  readonly accent: Accent;
  readonly density: Density;
  readonly motion: 'reduce' | 'full';
}

export const THEME_STORAGE_KEY = 'callboard.theme';

export const DEFAULT_PREFERENCES: ThemePreferences = {
  mode: 'system',
  accent: 'cobalt',
  density: 'comfortable',
  motion: 'system',
};

function pick<T extends string>(options: readonly T[], value: unknown, fallback: T): T {
  return options.find((option) => option === value) ?? fallback;
}

export function parsePreferences(raw: string | null): ThemePreferences {
  let value: unknown = null;
  if (raw) {
    try {
      value = JSON.parse(raw);
    } catch {
      value = null;
    }
  }
  const record =
    typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};

  return {
    mode: pick(THEME_MODES, record.mode, DEFAULT_PREFERENCES.mode),
    accent: pick(ACCENTS, record.accent, DEFAULT_PREFERENCES.accent),
    density: pick(DENSITIES, record.density, DEFAULT_PREFERENCES.density),
    motion: pick(MOTIONS, record.motion, DEFAULT_PREFERENCES.motion),
  };
}

export function resolvePreferences(
  preferences: ThemePreferences,
  system: SystemSignals,
): ResolvedTheme {
  const dark = preferences.mode === 'system' ? system.prefersDark : preferences.mode === 'dark';
  const reduce =
    preferences.motion === 'system' ? system.prefersReducedMotion : preferences.motion === 'reduce';

  return {
    theme: dark ? 'dark' : 'light',
    accent: preferences.accent,
    density: preferences.density,
    motion: reduce ? 'reduce' : 'full',
  };
}

export function applyResolvedTheme(root: HTMLElement, resolved: ResolvedTheme): void {
  root.dataset.theme = resolved.theme;
  root.dataset.accent = resolved.accent;
  root.dataset.density = resolved.density;
  root.dataset.motion = resolved.motion;
  root.style.colorScheme = resolved.theme;
}
