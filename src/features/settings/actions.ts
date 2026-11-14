'use server';

import { revalidatePath } from 'next/cache';
import { defaultLocale, isLocale, type Locale } from '@/i18n/locales';
import { redirect } from '@/i18n/navigation';
import { fieldErrorsFrom, type ActionResult, type FormErrorKey } from '@/features/auth/result';
import { resetPasswordSchema } from '@/features/auth/schemas';
import { formErrorFor, updatePassword } from '@/features/auth/service';
import { getCurrentMembership, getCurrentUser } from '@/features/organizations/queries';
import { createClient } from '@/lib/supabase/server';
import { getProfileSettings } from './queries';
import { deleteAccountSchema, notificationPreferencesSchema, profileSchema } from './schemas';

function localeOrDefault(value: string): Locale {
  return isLocale(value) ? value : defaultLocale;
}

async function requireUser() {
  const user = await getCurrentUser();
  return user ?? null;
}

export async function updateProfileAction(
  input: unknown,
  currentLocale: string,
): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { status: 'error', fieldErrors: fieldErrorsFrom(parsed.error) };

  const user = await requireUser();
  if (!user) return { status: 'error', formError: 'sessionExpired' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: parsed.data.displayName,
      locale: parsed.data.locale,
      time_zone: parsed.data.timeZone,
    })
    .eq('id', user.id);
  if (error) return { status: 'error', formError: 'generic' };

  revalidatePath('/', 'layout');
  if (parsed.data.locale !== currentLocale) {
    redirect({ href: '/settings', locale: localeOrDefault(parsed.data.locale) });
  }
  return { status: 'ok' };
}

export async function updateNotificationsAction(input: unknown): Promise<ActionResult> {
  const parsed = notificationPreferencesSchema.safeParse(input);
  if (!parsed.success) return { status: 'error', fieldErrors: fieldErrorsFrom(parsed.error) };

  const user = await requireUser();
  if (!user) return { status: 'error', formError: 'sessionExpired' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('profiles')
    .update({ notification_preferences: parsed.data })
    .eq('id', user.id);
  if (error) return { status: 'error', formError: 'generic' };

  revalidatePath('/', 'layout');
  return { status: 'ok' };
}

export async function changePasswordAction(input: unknown): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return { status: 'error', fieldErrors: fieldErrorsFrom(parsed.error) };

  const user = await requireUser();
  if (!user) return { status: 'error', formError: 'sessionExpired' };

  // Demo accounts are shared by every visitor, so their password must not change.
  const profile = await getProfileSettings(user.id);
  if (profile?.isDemo) return { status: 'error', formError: 'demoProtected' };

  const supabase = await createClient();
  return updatePassword(supabase.auth, parsed.data);
}

function deletionError(error: {
  code?: string | undefined;
  status?: number | undefined;
}): FormErrorKey {
  if (error.code === '23514') return 'soleOwner';
  if (error.code === '42501') return 'demoProtected';
  return formErrorFor(error);
}

export async function deleteAccountAction(input: unknown, locale: string): Promise<ActionResult> {
  const parsed = deleteAccountSchema.safeParse(input);
  if (!parsed.success) return { status: 'error', fieldErrors: fieldErrorsFrom(parsed.error) };

  const user = await requireUser();
  if (!user) return { status: 'error', formError: 'sessionExpired' };

  if (parsed.data.confirmation.toLowerCase() !== (user.email ?? '').toLowerCase()) {
    return { status: 'error', fieldErrors: { confirmation: 'confirmation.mismatch' } };
  }

  const membership = await getCurrentMembership();
  if (membership?.role === 'owner') {
    const supabase = await createClient();
    const { count } = await supabase
      .from('memberships')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', membership.organization.id)
      .eq('role', 'owner');
    if ((count ?? 0) <= 1) return { status: 'error', formError: 'soleOwner' };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc('delete_my_account');
  if (error) return { status: 'error', formError: deletionError(error) };

  await supabase.auth.signOut();
  redirect({ href: '/login', locale: localeOrDefault(locale) });
  return { status: 'ok' };
}
