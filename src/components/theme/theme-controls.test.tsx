import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import messages from '../../../messages/en.json';
import { THEME_STORAGE_KEY } from '@/lib/theme/preferences';
import { ThemeControls } from './theme-controls';

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal(
    'matchMedia',
    (query: string) =>
      ({
        matches: false,
        media: query,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      }) as unknown as MediaQueryList,
  );
});

function renderControls() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ThemeControls />
    </NextIntlClientProvider>,
  );
}

describe('ThemeControls', () => {
  it('applies and stores the chosen theme', async () => {
    const user = userEvent.setup();
    renderControls();

    await user.click(screen.getByRole('radio', { name: 'Dark' }));

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(JSON.parse(localStorage.getItem(THEME_STORAGE_KEY) ?? '{}')).toMatchObject({
      mode: 'dark',
    });
    expect(screen.getByRole('radio', { name: 'Dark' })).toBeChecked();
  });

  it('applies density and accent independently', async () => {
    const user = userEvent.setup();
    renderControls();

    await user.click(screen.getByRole('radio', { name: 'Compact' }));
    await user.click(screen.getByRole('radio', { name: 'Teal' }));

    expect(document.documentElement.dataset.density).toBe('compact');
    expect(document.documentElement.dataset.accent).toBe('teal');
  });

  it('groups each choice under a labelled fieldset', () => {
    renderControls();
    expect(screen.getByRole('group', { name: 'Theme' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Accent colour' })).toBeInTheDocument();
  });
});
