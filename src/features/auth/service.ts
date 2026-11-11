import type { SupabaseClient } from '@supabase/supabase-js';
import type { ActionResult, FormErrorKey } from './result';
import type { LoginInput, ResetPasswordInput, SignupInput } from './schemas';

export type AuthApi = Pick<
  SupabaseClient['auth'],
  'signInWithPassword' | 'signUp' | 'signOut' | 'resetPasswordForEmail' | 'updateUser'
>;

interface ErrorLike {
  readonly code?: string | undefined;
  readonly status?: number | undefined;
}

const ERROR_BY_CODE: Record<string, FormErrorKey> = {
  invalid_credentials: 'invalidCredentials',
  email_not_confirmed: 'emailNotConfirmed',
  over_request_rate_limit: 'rateLimited',
  over_email_send_rate_limit: 'rateLimited',
  over_sms_send_rate_limit: 'rateLimited',
  weak_password: 'weakPassword',
  signup_disabled: 'signupDisabled',
  email_provider_disabled: 'signupDisabled',
  session_not_found: 'sessionExpired',
  session_expired: 'sessionExpired',
  refresh_token_not_found: 'sessionExpired',
};

export function formErrorFor(error: ErrorLike): FormErrorKey {
  if (error.code && error.code in ERROR_BY_CODE) {
    return ERROR_BY_CODE[error.code] ?? 'generic';
  }
  if (error.status === 429) return 'rateLimited';
  return 'generic';
}

function failure(error: ErrorLike): ActionResult {
  return { status: 'error', formError: formErrorFor(error) };
}

export async function signIn(auth: AuthApi, input: LoginInput): Promise<ActionResult> {
  const { error } = await auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });
  return error ? failure(error) : { status: 'ok' };
}

export async function signUp(
  auth: AuthApi,
  input: SignupInput,
  confirmationUrl: string,
): Promise<ActionResult> {
  const { data, error } = await auth.signUp({
    email: input.email,
    password: input.password,
    options: { data: { display_name: input.displayName }, emailRedirectTo: confirmationUrl },
  });
  if (error) return failure(error);

  // With email confirmation on, an address that is already registered looks
  // exactly like a new sign-up, so the page cannot be used to find out who has
  // an account.
  return data.session ? { status: 'ok' } : { status: 'check-email' };
}

export async function requestPasswordReset(
  auth: AuthApi,
  email: string,
  redirectTo: string,
): Promise<ActionResult> {
  const { error } = await auth.resetPasswordForEmail(email, { redirectTo });
  if (error && formErrorFor(error) === 'rateLimited') return failure(error);
  // Same answer whether or not the address has an account.
  return { status: 'check-email' };
}

export async function updatePassword(
  auth: AuthApi,
  input: ResetPasswordInput,
): Promise<ActionResult> {
  const { error } = await auth.updateUser({ password: input.password });
  return error ? failure(error) : { status: 'ok' };
}

export async function signOutCurrentUser(auth: AuthApi): Promise<void> {
  await auth.signOut();
}
