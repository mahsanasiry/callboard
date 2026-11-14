import { describe, expect, it } from 'vitest';
import { fieldErrorsFrom } from '@/features/auth/result';
import { acceptInvitationSchema, changeRoleSchema, inviteSchema } from './schemas';

const department = '11111111-1111-4111-8111-111111111111';
const membership = '22222222-2222-4222-8222-222222222222';

function errors(schema: typeof inviteSchema | typeof changeRoleSchema, value: unknown) {
  const result = schema.safeParse(value);
  return result.success ? {} : fieldErrorsFrom(result.error);
}

describe('inviteSchema', () => {
  it('accepts an invitation for a role without a department', () => {
    expect(
      inviteSchema.safeParse({ email: ' new@example.com ', role: 'crew', departmentId: null })
        .success,
    ).toBe(true);
  });

  it('requires a department for a department lead', () => {
    expect(
      errors(inviteSchema, { email: 'a@b.co', role: 'department_lead', departmentId: null }),
    ).toEqual({
      departmentId: 'department.required',
    });
    expect(
      inviteSchema.safeParse({ email: 'a@b.co', role: 'department_lead', departmentId: department })
        .success,
    ).toBe(true);
  });

  it('refuses a department on any other role', () => {
    expect(
      errors(inviteSchema, { email: 'a@b.co', role: 'viewer', departmentId: department }),
    ).toEqual({
      departmentId: 'department.required',
    });
  });

  it('rejects an unknown role and a bad address', () => {
    expect(
      inviteSchema.safeParse({ email: 'a@b.co', role: 'admin', departmentId: null }).success,
    ).toBe(false);
    expect(errors(inviteSchema, { email: 'nope', role: 'viewer', departmentId: null })).toEqual({
      email: 'email.invalid',
    });
  });
});

describe('changeRoleSchema', () => {
  it('needs a real membership id', () => {
    expect(
      changeRoleSchema.safeParse({ membershipId: 'x', role: 'crew', departmentId: null }).success,
    ).toBe(false);
    expect(
      changeRoleSchema.safeParse({ membershipId: membership, role: 'crew', departmentId: null })
        .success,
    ).toBe(true);
  });

  it('applies the same department rule', () => {
    expect(
      changeRoleSchema.safeParse({
        membershipId: membership,
        role: 'department_lead',
        departmentId: null,
      }).success,
    ).toBe(false);
  });
});

describe('acceptInvitationSchema', () => {
  it('rejects tokens that are too short or too long to be real', () => {
    expect(acceptInvitationSchema.safeParse({ token: 'short' }).success).toBe(false);
    expect(acceptInvitationSchema.safeParse({ token: 'x'.repeat(201) }).success).toBe(false);
    expect(acceptInvitationSchema.safeParse({ token: 'x'.repeat(43) }).success).toBe(true);
  });
});
