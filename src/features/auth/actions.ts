'use server';

import { redirect } from '@/i18n/navigation';
import { isLocale, type Locale, defaultLocale } from '@/i18n/locales';
import { DEFAULT_SIGNED_IN_PATH, safeNextPath } from '@/lib/auth/access';
import { siteUrl } from '@/lib/site';
import { createClient } from '@/lib/supabase/server';
import { demoEmail, isDemoRole, readDemoConfig } from './demo';
import { fieldErrorsFrom, type ActionResult } from './result';
import { forgotPasswordSchema, loginSchema, resetPasswordSchema, signupSchema } from './schemas';
import {
  requestPasswordReset,
  signIn,
  signOutCurrentUser,
  signUp,
  updatePassword,
} from './service';

function localeOrDefault(value: string): Locale {
  return isLocale(value) ? value : defaultLocale;
}

function confirmationUrl(): string {
  return `${siteUrl}/auth/confirm`;
}

export async function signInAction(
  input: unknown,
  locale: string,
  next: string | null,
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { status: 'error', fieldErrors: fieldErrorsFrom(parsed.error) };

  const supabase = await createClient();
  const result = await signIn(supabase.auth, parsed.data);
  if (result.status !== 'ok') return result;

  redirect({ href: safeNextPath(next) ?? DEFAULT_SIGNED_IN_PATH, locale: localeOrDefault(locale) });
  return result;
}

export async function signUpAction(input: unknown, locale: string): Promise<ActionResult> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) return { status: 'error', fieldErrors: fieldErrorsFrom(parsed.error) };

  const supabase = await createClient();
  const result = await signUp(supabase.auth, parsed.data, confirmationUrl());
  if (result.status === 'ok') {
    redirect({ href: DEFAULT_SIGNED_IN_PATH, locale: localeOrDefault(locale) });
  }
  if (result.status === 'check-email') {
    redirect({ href: '/check-email?reason=signup', locale: localeOrDefault(locale) });
  }
  return result;
}

export async function forgotPasswordAction(input: unknown, locale: string): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) return { status: 'error', fieldErrors: fieldErrorsFrom(parsed.error) };

  const supabase = await createClient();
  const result = await requestPasswordReset(
    supabase.auth,
    parsed.data.email,
    `${confirmationUrl()}?next=${encodeURIComponent('/reset-password')}`,
  );
  if (result.status === 'check-email') {
    redirect({ href: '/check-email?reason=recovery', locale: localeOrDefault(locale) });
  }
  return result;
}

export async function resetPasswordAction(input: unknown, locale: string): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return { status: 'error', fieldErrors: fieldErrorsFrom(parsed.error) };

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { status: 'error', formError: 'sessionExpired' };

  const result = await updatePassword(supabase.auth, parsed.data);
  if (result.status === 'ok') {
    redirect({ href: DEFAULT_SIGNED_IN_PATH, locale: localeOrDefault(locale) });
  }
  return result;
}

export async function signOutAction(locale: string): Promise<void> {
  const supabase = await createClient();
  await signOutCurrentUser(supabase.auth);
  redirect({ href: '/login', locale: localeOrDefault(locale) });
}

export async function signInAsDemoAction(role: string, locale: string): Promise<ActionResult> {
  const config = readDemoConfig();
  if (!config || !isDemoRole(role)) return { status: 'error', formError: 'demoUnavailable' };

  const supabase = await createClient();
  const result = await signIn(supabase.auth, {
    email: demoEmail(config.emailTemplate, role),
    password: config.password,
  });
  if (result.status !== 'ok') {
    return { status: 'error', formError: 'demoUnavailable' };
  }

  redirect({ href: DEFAULT_SIGNED_IN_PATH, locale: localeOrDefault(locale) });
  return result;
}
