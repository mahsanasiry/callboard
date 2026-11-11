// @vitest-environment node
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const exchangeCodeForSession = vi.fn();
const verifyOtp = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve({ auth: { exchangeCodeForSession, verifyOtp } }),
}));

const { GET } = await import('./route');

function request(query: string, cookie?: string) {
  return new NextRequest(`https://site.test/auth/confirm${query}`, {
    headers: cookie ? { cookie } : {},
  });
}

async function locationOf(query: string, cookie?: string) {
  const response = await GET(request(query, cookie));
  expect(response.status).toBe(307);
  return (
    new URL(response.headers.get('location') ?? '').pathname +
    new URL(response.headers.get('location') ?? '').search
  );
}

beforeEach(() => {
  exchangeCodeForSession.mockReset().mockResolvedValue({ error: null });
  verifyOtp.mockReset().mockResolvedValue({ error: null });
});

describe('GET /auth/confirm', () => {
  it('exchanges a code and lands on the dashboard', async () => {
    expect(await locationOf('?code=abc')).toBe('/en/dashboard');
    expect(exchangeCodeForSession).toHaveBeenCalledWith('abc');
    expect(verifyOtp).not.toHaveBeenCalled();
  });

  it('sends a password reset to the reset page', async () => {
    expect(await locationOf('?code=abc&next=/reset-password')).toBe('/en/reset-password');
  });

  it('verifies a token hash from a custom template', async () => {
    expect(await locationOf('?token_hash=hash&type=signup')).toBe('/en/dashboard');
    expect(verifyOtp).toHaveBeenCalledWith({ type: 'signup', token_hash: 'hash' });
  });

  it('keeps the visitor language from the locale cookie', async () => {
    expect(await locationOf('?code=abc', 'NEXT_LOCALE=fa')).toBe('/fa/dashboard');
  });

  it('ignores a destination that leaves the site', async () => {
    expect(await locationOf('?code=abc&next=https://evil.example')).toBe('/en/dashboard');
    expect(await locationOf('?code=abc&next=//evil.example')).toBe('/en/dashboard');
  });

  it('reports a failed exchange on the login page', async () => {
    exchangeCodeForSession.mockResolvedValue({ error: { code: 'flow_state_not_found' } });
    expect(await locationOf('?code=stale')).toBe('/en/login?error=confirmationFailed');
  });

  it('reports a failed token check on the login page', async () => {
    verifyOtp.mockResolvedValue({ error: { code: 'otp_expired' } });
    expect(await locationOf('?token_hash=old&type=recovery')).toBe(
      '/en/login?error=confirmationFailed',
    );
  });

  it('rejects a request with neither a code nor a token', async () => {
    expect(await locationOf('')).toBe('/en/login?error=confirmationFailed');
    expect(await locationOf('?token_hash=x&type=not-a-type')).toBe(
      '/en/login?error=confirmationFailed',
    );
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
    expect(verifyOtp).not.toHaveBeenCalled();
  });
});
