import { z } from 'zod';
import { ROLES } from '@/lib/permissions/policy';
import { emailField } from '@/features/auth/schemas';

const departmentId = z.uuid().nullable();

function departmentMatchesRole(value: { role: string; departmentId: string | null }): boolean {
  return (value.role === 'department_lead') === (value.departmentId !== null);
}

export const inviteSchema = z
  .object({
    email: emailField,
    role: z.enum(ROLES),
    departmentId,
  })
  .refine(departmentMatchesRole, { path: ['departmentId'], message: 'department.required' });

export const changeRoleSchema = z
  .object({
    membershipId: z.uuid(),
    role: z.enum(ROLES),
    departmentId,
  })
  .refine(departmentMatchesRole, { path: ['departmentId'], message: 'department.required' });

export const membershipIdSchema = z.object({ membershipId: z.uuid() });
export const invitationIdSchema = z.object({ invitationId: z.uuid() });
export const acceptInvitationSchema = z.object({ token: z.string().min(20).max(200) });

export type InviteInput = z.infer<typeof inviteSchema>;
export type ChangeRoleInput = z.infer<typeof changeRoleSchema>;
