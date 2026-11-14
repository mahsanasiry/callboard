import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import messages from '../../../messages/en.json';

const signOutAction = vi.fn();

vi.mock('@/features/auth/actions', () => ({
  signOutAction: (...args: unknown[]) => signOutAction(...args) as unknown,
}));

const { UserMenu } = await import('./user-menu');

beforeAll(() => {
  // jsdom lacks the pointer APIs Radix menus rely on.
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => undefined;
  Element.prototype.releasePointerCapture = () => undefined;
  Element.prototype.scrollIntoView = () => undefined;
});

beforeEach(() => {
  signOutAction.mockReset().mockResolvedValue(undefined);
});

function renderMenu() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <UserMenu displayName="Noor Vance" email="noor@example.com" roleLabel="Owner" />
    </NextIntlClientProvider>,
  );
}

describe('UserMenu', () => {
  it('shows who is signed in and their role', async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole('button', { name: 'Account menu' }));

    expect(await screen.findByText('Noor Vance')).toBeInTheDocument();
    expect(screen.getByText('noor@example.com')).toBeInTheDocument();
    expect(screen.getByText('Owner')).toBeInTheDocument();
  });

  it('signs out in the current language when Sign out is chosen', async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole('button', { name: 'Account menu' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Sign out' }));

    await waitFor(() => {
      expect(signOutAction).toHaveBeenCalledWith('en');
    });
  });

  it('signs out from the keyboard too', async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole('button', { name: 'Account menu' }));
    const item = await screen.findByRole('menuitem', { name: 'Sign out' });
    item.focus();
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(signOutAction).toHaveBeenCalledTimes(1);
    });
  });
});
