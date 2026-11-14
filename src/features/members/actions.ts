'use server';

import { revalidatePath } from 'next/cache';
import { fieldErrorsFrom, type ActionResult, type FormErrorKey } from '@/features/auth/result';
import { getCurrentMembership, getCurrentUser } from '@/features/organizations/queries';
import {
  INVITATION_LIFETIME_DAYS,
  generateInvitationToken,
  hashInvitationToken,
  invitationLink,
} from '@/features/invitations/token';
import { defaultLocale, isLocale, type Locale } from '@/i18n/locales';
import { redirect } from '@/i18n/navigation';
import { authorize } from '@/lib/permissions/server';
import type { Permission } from '@/lib/permissions/policy';
import { siteUrl } from '@/lib/site';
import { createClient } from '@/lib/supabase/server';
import {
  acceptInvitationSchema,
  changeRoleSchema,
  invitationIdSchema,
  inviteSchema,
  membershipIdSchema,
} from './schemas';

export type InviteResult = ActionResult | { readonly status: 'invited'; readonly link: string };

function localeOrDefault(value: string): Locale {
  return isLocale(value) ? value : defaultLocale;
}

interface DatabaseError {
  readonly code?: string | undefined;
}

function memberError(error: DatabaseError): FormErrorKey {
  switch (error.code) {
    case '23514':
      return 'lastOwner';
    case '42501':
      return 'demoProtected';
    default:
      return 'generic';
  }
}

async function guard(
  permission: Permission,
): Promise<{ organizationId: string; userId: string } | ActionResult> {
  const [user, membership] = await Promise.all([getCurrentUser(), getCurrentMembership()]);
  if (!user || !membership) return { status: 'error', formError: 'sessionExpired' };
  const decision = await authorize(permission);
  if (!decision.allowed) return { status: 'error', formError: 'forbidden' };
  return { organizationId: membership.organization.id, userId: user.id };
}

function isFailure(
  value: { organizationId: string; userId: string } | ActionResult,
): value is ActionResult {
  return 'status' in value;
}

export async function createInvitationAction(
  input: unknown,
  locale: string,
): Promise<InviteResult> {
  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) return { status: 'error', fieldErrors: fieldErrorsFrom(parsed.error) };

  const allowed = await guard('member:invite');
  if (isFailure(allowed)) return allowed;

  const token = generateInvitationToken();
  const supabase = await createClient();
  const { error } = await supabase.from('invitations').insert({
    organization_id: allowed.organizationId,
    email: parsed.data.email.toLowerCase(),
    role: parsed.data.role,
    department_id: parsed.data.departmentId,
    token_hash: hashInvitationToken(token),
    invited_by: allowed.userId,
    expires_at: new Date(Date.now() + INVITATION_LIFETIME_DAYS * 86_400_000).toISOString(),
  });
  if (error) return { status: 'error', formError: 'generic' };

  revalidatePath('/', 'layout');
  return { status: 'invited', link: invitationLink(siteUrl, localeOrDefault(locale), token) };
}

export async function revokeInvitationAction(input: unknown): Promise<ActionResult> {
  const parsed = invitationIdSchema.safeParse(input);
  if (!parsed.success) return { status: 'error', formError: 'generic' };
  const allowed = await guard('member:invite');
  if (isFailure(allowed)) return allowed;

  const supabase = await createClient();
  const { error } = await supabase
    .from('invitations')
    .delete()
    .eq('id', parsed.data.invitationId)
    .eq('organization_id', allowed.organizationId);
  if (error) return { status: 'error', formError: 'generic' };

  revalidatePath('/', 'layout');
  return { status: 'ok' };
}

export async function changeRoleAction(input: unknown): Promise<ActionResult> {
  const parsed = changeRoleSchema.safeParse(input);
  if (!parsed.success) return { status: 'error', fieldErrors: fieldErrorsFrom(parsed.error) };
  const allowed = await guard('member:changeRole');
  if (isFailure(allowed)) return allowed;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('memberships')
    .update({ role: parsed.data.role, department_id: parsed.data.departmentId })
    .eq('id', parsed.data.membershipId)
    .eq('organization_id', allowed.organizationId)
    .select('id');
  if (error) return { status: 'error', formError: memberError(error) };
  if (!Array.isArray(data) || data.length === 0) return { status: 'error', formError: 'forbidden' };

  revalidatePath('/', 'layout');
  return { status: 'ok' };
}

export async function removeMemberAction(input: unknown): Promise<ActionResult> {
  const parsed = membershipIdSchema.safeParse(input);
  if (!parsed.success) return { status: 'error', formError: 'generic' };
  const allowed = await guard('member:remove');
  if (isFailure(allowed)) return allowed;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('memberships')
    .delete()
    .eq('id', parsed.data.membershipId)
    .eq('organization_id', allowed.organizationId)
    .select('id');
  if (error) return { status: 'error', formError: memberError(error) };
  if (!Array.isArray(data) || data.length === 0) return { status: 'error', formError: 'forbidden' };

  revalidatePath('/', 'layout');
  return { status: 'ok' };
}

function acceptError(error: DatabaseError): FormErrorKey {
  switch (error.code) {
    case 'P0002':
      return 'invitationInvalid';
    case '42501':
      return 'invitationWrongAddress';
    case '23505':
      return 'alreadyMember';
    default:
      return 'generic';
  }
}

export async function acceptInvitationAction(
  input: unknown,
  locale: string,
): Promise<ActionResult> {
  const parsed = acceptInvitationSchema.safeParse(input);
  if (!parsed.success) return { status: 'error', formError: 'invitationInvalid' };

  const user = await getCurrentUser();
  if (!user) return { status: 'error', formError: 'sessionExpired' };

  const supabase = await createClient();
  const { error } = await supabase.rpc('accept_invitation', {
    invitation_hash: hashInvitationToken(parsed.data.token),
  });
  if (error) return { status: 'error', formError: acceptError(error) };

  revalidatePath('/', 'layout');
  redirect({ href: '/dashboard', locale: localeOrDefault(locale) });
  return { status: 'ok' };
}
