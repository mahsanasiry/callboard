import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import messages from '../../../messages/en.json';
import { THEME_STORAGE_KEY } from '@/lib/theme/preferences';
import { ThemeMenu } from './theme-menu';

beforeAll(() => {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => undefined;
  Element.prototype.releasePointerCapture = () => undefined;
  Element.prototype.scrollIntoView = () => undefined;
});

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

function renderMenu() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ThemeMenu />
    </NextIntlClientProvider>,
  );
}

describe('ThemeMenu', () => {
  it('is reachable by name and offers light, dark and system', async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole('button', { name: 'Appearance' }));

    expect(await screen.findByRole('menuitemradio', { name: 'Light' })).toBeInTheDocument();
    expect(screen.getByRole('menuitemradio', { name: 'Dark' })).toBeInTheDocument();
    expect(screen.getByRole('menuitemradio', { name: 'Match system' })).toBeChecked();
  });

  it('applies and remembers the chosen theme', async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole('button', { name: 'Appearance' }));
    await user.click(await screen.findByRole('menuitemradio', { name: 'Dark' }));

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(JSON.parse(localStorage.getItem(THEME_STORAGE_KEY) ?? '{}')).toMatchObject({
      mode: 'dark',
    });
  });
});
