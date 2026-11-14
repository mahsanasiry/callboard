import { z } from 'zod';
import { ROLES } from '@/lib/permissions/policy';
import { createClient } from '@/lib/supabase/server';

const membershipRow = z.object({
  id: z.string(),
  user_id: z.string(),
  role: z.enum(ROLES),
  department_id: z.string().nullable(),
});
const profileRow = z.object({ id: z.string(), display_name: z.string() });
const departmentRow = z.object({ id: z.string(), name: z.string() });
const invitationRow = z.object({
  id: z.string(),
  email: z.string(),
  role: z.enum(ROLES),
  department_id: z.string().nullable(),
  expires_at: z.string(),
});

export interface Member {
  readonly membershipId: string;
  readonly userId: string;
  readonly name: string;
  readonly role: (typeof ROLES)[number];
  readonly departmentId: string | null;
}

export interface Department {
  readonly id: string;
  readonly name: string;
}

export interface PendingInvitation {
  readonly id: string;
  readonly email: string;
  readonly role: (typeof ROLES)[number];
  readonly departmentId: string | null;
  readonly expiresAt: string;
}

export async function listMembers(organizationId: string): Promise<Member[]> {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from('memberships')
    .select('id, user_id, role, department_id')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: true });

  const memberships = z.array(membershipRow).catch([]).parse(rows);
  if (memberships.length === 0) return [];

  const { data: profileRows } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in(
      'id',
      memberships.map((membership) => membership.user_id),
    );
  const names = new Map(
    z
      .array(profileRow)
      .catch([])
      .parse(profileRows)
      .map((profile) => [profile.id, profile.display_name]),
  );

  return memberships.map((membership) => ({
    membershipId: membership.id,
    userId: membership.user_id,
    name: names.get(membership.user_id) ?? '',
    role: membership.role,
    departmentId: membership.department_id,
  }));
}

export async function listDepartments(organizationId: string): Promise<Department[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('departments')
    .select('id, name')
    .eq('organization_id', organizationId)
    .order('name', { ascending: true });
  return z.array(departmentRow).catch([]).parse(data);
}

export async function listPendingInvitations(organizationId: string): Promise<PendingInvitation[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('invitations')
    .select('id, email, role, department_id, expires_at')
    .eq('organization_id', organizationId)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  return z
    .array(invitationRow)
    .catch([])
    .parse(data)
    .map((row) => ({
      id: row.id,
      email: row.email,
      role: row.role,
      departmentId: row.department_id,
      expiresAt: row.expires_at,
    }));
}
