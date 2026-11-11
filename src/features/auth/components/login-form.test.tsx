import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import messages from '../../../../messages/en.json';
import fa from '../../../../messages/fa.json';

const signInAction = vi.fn();

vi.mock('../actions', () => ({
  signInAction: (...args: unknown[]) => signInAction(...args) as unknown,
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const { LoginForm } = await import('./login-form');

function renderForm(
  props: { next?: string | null; initialError?: 'sessionExpired' | null } = {},
  locale: 'en' | 'fa' = 'en',
) {
  return render(
    <NextIntlClientProvider locale={locale} messages={locale === 'en' ? messages : fa}>
      <LoginForm next={props.next ?? null} initialError={props.initialError ?? null} />
    </NextIntlClientProvider>,
  );
}

beforeEach(() => {
  signInAction.mockReset();
});

describe('LoginForm', () => {
  it('shows a message under each empty field and moves focus to the first one', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    const email = screen.getByLabelText('Email');
    expect(await screen.findAllByText('This field is required.')).toHaveLength(2);
    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(email).toHaveFocus();
    expect(signInAction).not.toHaveBeenCalled();
  });

  it('links the message to its field for screen readers', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    const email = screen.getByLabelText('Email');
    const message = await screen.findByText('Enter a valid email address.');
    expect(email.getAttribute('aria-describedby')).toContain(message.id);
  });

  it('sends the values, the locale and the destination to the server action', async () => {
    const user = userEvent.setup();
    signInAction.mockResolvedValue({ status: 'ok' });
    renderForm({ next: '/dashboard' });

    await user.type(screen.getByLabelText('Email'), 'ada@example.com');
    await user.type(screen.getByLabelText('Password'), 'correct horse');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(signInAction).toHaveBeenCalledWith(
        { email: 'ada@example.com', password: 'correct horse' },
        'en',
        '/dashboard',
      );
    });
  });

  it('shows a server error in an alert and keeps what was typed', async () => {
    const user = userEvent.setup();
    signInAction.mockResolvedValue({ status: 'error', formError: 'invalidCredentials' });
    renderForm();

    await user.type(screen.getByLabelText('Email'), 'ada@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrong password');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "That email and password don't match",
    );
    expect(screen.getByLabelText('Email')).toHaveValue('ada@example.com');
  });

  it('shows a reason carried over from another page', () => {
    renderForm({ initialError: 'sessionExpired' });
    expect(screen.getByRole('alert')).toHaveTextContent('Your session has ended');
  });

  it('reveals and hides the password on request', async () => {
    const user = userEvent.setup();
    renderForm();

    const password = screen.getByLabelText('Password');
    expect(password).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(password).toHaveAttribute('type', 'text');
    await user.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(password).toHaveAttribute('type', 'password');
  });

  it('renders in Persian', () => {
    renderForm({}, 'fa');
    expect(screen.getByLabelText('ایمیل')).toBeInTheDocument();
    expect(screen.getByLabelText('رمز عبور')).toBeInTheDocument();
  });
});
