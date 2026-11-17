'use server';

import { revalidatePath } from 'next/cache';
import { fieldErrorsFrom, type ActionResult } from '@/features/auth/result';
import { getCurrentMembership } from '@/features/organizations/queries';
import { defaultLocale, isLocale } from '@/i18n/locales';
import { redirect } from '@/i18n/navigation';
import { authorize } from '@/lib/permissions/server';
import { createClient } from '@/lib/supabase/server';
import { crewIdSchema, crewSchema, type CrewInput } from './schemas';

function target(locale: string) {
  return isLocale(locale) ? locale : defaultLocale;
}

function columns(input: CrewInput) {
  return {
    full_name: input.fullName,
    role_title: input.roleTitle,
    department_id: input.departmentId,
    email: input.email === '' ? null : input.email,
    phone: input.phone === '' ? null : input.phone,
    preferred_locale: input.preferredLocale,
    notes: input.notes,
  };
}

function databaseFailure(error: { code?: string | undefined }): ActionResult {
  return { status: 'error', formError: error.code === '42501' ? 'forbidden' : 'generic' };
}

export async function createCrewAction(input: unknown, locale: string): Promise<ActionResult> {
  const parsed = crewSchema.safeParse(input);
  if (!parsed.success) return { status: 'error', fieldErrors: fieldErrorsFrom(parsed.error) };

  const membership = await getCurrentMembership();
  if (!membership) return { status: 'error', formError: 'sessionExpired' };
  if (!(await authorize('crewMember:create')).allowed)
    return { status: 'error', formError: 'forbidden' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('crew_members')
    .insert({ organization_id: membership.organization.id, ...columns(parsed.data) });
  if (error) return databaseFailure(error);

  revalidatePath('/', 'layout');
  redirect({ href: '/crew', locale: target(locale) });
  return { status: 'ok' };
}

export async function updateCrewAction(
  id: string,
  input: unknown,
  locale: string,
): Promise<ActionResult> {
  const parsedId = crewIdSchema.safeParse({ id });
  const parsed = crewSchema.safeParse(input);
  if (!parsedId.success) return { status: 'error', formError: 'generic' };
  if (!parsed.success) return { status: 'error', fieldErrors: fieldErrorsFrom(parsed.error) };
  if (!(await authorize('crewMember:update')).allowed)
    return { status: 'error', formError: 'forbidden' };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('crew_members')
    .update(columns(parsed.data))
    .eq('id', parsedId.data.id)
    .select('id');
  if (error) return databaseFailure(error);
  if (!Array.isArray(data) || data.length === 0) return { status: 'error', formError: 'forbidden' };

  revalidatePath('/', 'layout');
  redirect({ href: '/crew', locale: target(locale) });
  return { status: 'ok' };
}

async function setArchived(id: string, archived: boolean, locale: string): Promise<ActionResult> {
  const parsedId = crewIdSchema.safeParse({ id });
  if (!parsedId.success) return { status: 'error', formError: 'generic' };
  const permission = archived ? 'crewMember:delete' : 'crewMember:update';
  if (!(await authorize(permission)).allowed) return { status: 'error', formError: 'forbidden' };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('crew_members')
    .update({ deleted_at: archived ? new Date().toISOString() : null })
    .eq('id', parsedId.data.id)
    .select('id');
  if (error) return databaseFailure(error);
  if (!Array.isArray(data) || data.length === 0) return { status: 'error', formError: 'forbidden' };

  revalidatePath('/', 'layout');
  redirect({ href: '/crew', locale: target(locale) });
  return { status: 'ok' };
}

export async function archiveCrewAction(id: string, locale: string): Promise<ActionResult> {
  return setArchived(id, true, locale);
}

export async function restoreCrewAction(id: string, locale: string): Promise<ActionResult> {
  return setArchived(id, false, locale);
}
