import { describe, expect, it, vi } from 'vitest';
import {
  formErrorFor,
  requestPasswordReset,
  signIn,
  signUp,
  updatePassword,
  type AuthApi,
} from './service';

type AuthError = { code?: string; status?: number } | null;

function fakeAuth(overrides: Partial<Record<keyof AuthApi, unknown>> = {}): AuthApi {
  return {
    signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
    signUp: vi.fn().mockResolvedValue({ data: { session: null, user: {} }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
    updateUser: vi.fn().mockResolvedValue({ error: null }),
    ...overrides,
  } as unknown as AuthApi;
}

const login = { email: 'a@b.co', password: 'secret-password' };

describe('formErrorFor', () => {
  it.each([
    [{ code: 'invalid_credentials' }, 'invalidCredentials'],
    [{ code: 'email_not_confirmed' }, 'emailNotConfirmed'],
    [{ code: 'over_email_send_rate_limit' }, 'rateLimited'],
    [{ code: 'weak_password' }, 'weakPassword'],
    [{ status: 429 }, 'rateLimited'],
    [{ code: 'something_new' }, 'generic'],
    [{}, 'generic'],
  ] as const)('maps %j to %s', (error, expected) => {
    expect(formErrorFor(error)).toBe(expected);
  });
});

describe('signIn', () => {
  it('passes the credentials through and reports success', async () => {
    const auth = fakeAuth();
    expect(await signIn(auth, login)).toEqual({ status: 'ok' });
    expect(auth.signInWithPassword).toHaveBeenCalledWith(login);
  });

  it('turns an auth error into a form error without leaking its text', async () => {
    const error: AuthError = { code: 'invalid_credentials', status: 400 };
    const auth = fakeAuth({ signInWithPassword: vi.fn().mockResolvedValue({ error }) });
    expect(await signIn(auth, login)).toEqual({ status: 'error', formError: 'invalidCredentials' });
  });
});

describe('signUp', () => {
  const input = {
    displayName: 'Ada',
    email: 'ada@example.com',
    password: 'long-enough-password',
    confirmPassword: 'long-enough-password',
  };

  it('asks the person to check their email when confirmation is on', async () => {
    const auth = fakeAuth();
    expect(await signUp(auth, input, 'https://site.test/auth/confirm')).toEqual({
      status: 'check-email',
    });
    expect(auth.signUp).toHaveBeenCalledWith({
      email: input.email,
      password: input.password,
      options: { data: { display_name: 'Ada' }, emailRedirectTo: 'https://site.test/auth/confirm' },
    });
  });

  it('signs the person straight in when confirmation is off', async () => {
    const auth = fakeAuth({
      signUp: vi.fn().mockResolvedValue({ data: { session: { access_token: 'x' } }, error: null }),
    });
    expect(await signUp(auth, input, 'https://site.test/auth/confirm')).toEqual({ status: 'ok' });
  });

  it('reports a provider error', async () => {
    const auth = fakeAuth({
      signUp: vi
        .fn()
        .mockResolvedValue({ data: { session: null }, error: { code: 'weak_password' } }),
    });
    expect(await signUp(auth, input, 'https://site.test/auth/confirm')).toEqual({
      status: 'error',
      formError: 'weakPassword',
    });
  });
});

describe('requestPasswordReset', () => {
  it('answers the same way for unknown addresses', async () => {
    const auth = fakeAuth({
      resetPasswordForEmail: vi.fn().mockResolvedValue({ error: { code: 'user_not_found' } }),
    });
    expect(await requestPasswordReset(auth, 'x@y.co', 'https://site.test/auth/confirm')).toEqual({
      status: 'check-email',
    });
  });

  it('still reports rate limiting', async () => {
    const auth = fakeAuth({
      resetPasswordForEmail: vi
        .fn()
        .mockResolvedValue({ error: { code: 'over_email_send_rate_limit' } }),
    });
    expect(await requestPasswordReset(auth, 'x@y.co', 'https://site.test/auth/confirm')).toEqual({
      status: 'error',
      formError: 'rateLimited',
    });
  });
});

describe('updatePassword', () => {
  it('updates the password of the current session', async () => {
    const auth = fakeAuth();
    const result = await updatePassword(auth, {
      password: 'a-new-long-password',
      confirmPassword: 'a-new-long-password',
    });
    expect(result).toEqual({ status: 'ok' });
    expect(auth.updateUser).toHaveBeenCalledWith({ password: 'a-new-long-password' });
  });
});
