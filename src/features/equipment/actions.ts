'use server';

import { revalidatePath } from 'next/cache';
import { fieldErrorsFrom, type ActionResult } from '@/features/auth/result';
import { getCurrentMembership } from '@/features/organizations/queries';
import { defaultLocale, isLocale } from '@/i18n/locales';
import { redirect } from '@/i18n/navigation';
import { authorize } from '@/lib/permissions/server';
import { createClient } from '@/lib/supabase/server';
import { isEquipmentNameFree } from './queries';
import { equipmentSchema, idSchema, nameCheckSchema } from './schemas';

function target(locale: string) {
  return isLocale(locale) ? locale : defaultLocale;
}

interface DatabaseError {
  readonly code?: string | undefined;
}

function failure(error: DatabaseError): ActionResult {
  if (error.code === '23505') return { status: 'error', fieldErrors: { name: 'name.taken' } };
  if (error.code === '42501') return { status: 'error', formError: 'forbidden' };
  return { status: 'error', formError: 'generic' };
}

function columns(input: ReturnType<typeof equipmentSchema.parse>) {
  return {
    name: input.name,
    category: input.category,
    status: input.status,
    department_id: input.departmentId,
    asset_tag: input.assetTag === '' ? null : input.assetTag,
    notes: input.notes,
  };
}

export async function createEquipmentAction(input: unknown, locale: string): Promise<ActionResult> {
  const parsed = equipmentSchema.safeParse(input);
  if (!parsed.success) return { status: 'error', fieldErrors: fieldErrorsFrom(parsed.error) };

  const membership = await getCurrentMembership();
  if (!membership) return { status: 'error', formError: 'sessionExpired' };
  const decision = await authorize('equipment:create', { departmentId: parsed.data.departmentId });
  if (!decision.allowed) return { status: 'error', formError: 'forbidden' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('equipment_items')
    .insert({ organization_id: membership.organization.id, ...columns(parsed.data) });
  if (error) return failure(error);

  revalidatePath('/', 'layout');
  redirect({ href: '/equipment', locale: target(locale) });
  return { status: 'ok' };
}

export async function updateEquipmentAction(
  id: string,
  input: unknown,
  locale: string,
): Promise<ActionResult> {
  const parsedId = idSchema.safeParse({ id });
  const parsed = equipmentSchema.safeParse(input);
  if (!parsedId.success) return { status: 'error', formError: 'generic' };
  if (!parsed.success) return { status: 'error', fieldErrors: fieldErrorsFrom(parsed.error) };

  const decision = await authorize('equipment:update', { departmentId: parsed.data.departmentId });
  if (!decision.allowed) return { status: 'error', formError: 'forbidden' };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('equipment_items')
    .update(columns(parsed.data))
    .eq('id', parsedId.data.id)
    .select('id');
  if (error) return failure(error);
  if (!Array.isArray(data) || data.length === 0) return { status: 'error', formError: 'forbidden' };

  revalidatePath('/', 'layout');
  redirect({ href: '/equipment', locale: target(locale) });
  return { status: 'ok' };
}

async function setArchived(id: string, archived: boolean, locale: string): Promise<ActionResult> {
  const parsedId = idSchema.safeParse({ id });
  if (!parsedId.success) return { status: 'error', formError: 'generic' };

  const decision = await authorize(archived ? 'equipment:delete' : 'equipment:update');
  if (!decision.allowed) return { status: 'error', formError: 'forbidden' };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('equipment_items')
    .update({ deleted_at: archived ? new Date().toISOString() : null })
    .eq('id', parsedId.data.id)
    .select('id');
  if (error) return failure(error);
  if (!Array.isArray(data) || data.length === 0) return { status: 'error', formError: 'forbidden' };

  revalidatePath('/', 'layout');
  redirect({ href: '/equipment', locale: target(locale) });
  return { status: 'ok' };
}

export async function archiveEquipmentAction(id: string, locale: string): Promise<ActionResult> {
  return setArchived(id, true, locale);
}

export async function restoreEquipmentAction(id: string, locale: string): Promise<ActionResult> {
  return setArchived(id, false, locale);
}

/** Lets the form say "already used" while the person is still typing. */
export async function checkEquipmentNameAction(
  name: string,
  exceptId: string | null,
): Promise<boolean> {
  const parsed = nameCheckSchema.safeParse({ name, exceptId });
  if (!parsed.success) return true;
  return isEquipmentNameFree(parsed.data.name, parsed.data.exceptId);
}
