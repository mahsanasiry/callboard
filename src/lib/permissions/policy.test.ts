import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderMatrix } from './matrix';
import { can, GRANTS, isAllowed, PERMISSIONS, ROLES, type Role, type Subject } from './policy';

const CAMERA = 'dept-camera';
const SOUND = 'dept-sound';
const PRODUCTION_A = 'prod-a';
const PRODUCTION_B = 'prod-b';

function subject(role: Role, overrides: Partial<Subject> = {}): Subject {
  return {
    userId: `user-${role}`,
    role,
    departmentId: role === 'department_lead' ? CAMERA : null,
    assignedProductionIds: new Set(role === 'crew' ? [PRODUCTION_A] : []),
    ...overrides,
  };
}

describe('can', () => {
  it('denies everything to someone who is not a member', () => {
    for (const permission of PERMISSIONS) {
      expect(can(null, permission)).toEqual({ allowed: false, reason: 'not-a-member' });
    }
  });

  it('lets owners do everything', () => {
    const owner = subject('owner');
    for (const permission of PERMISSIONS) {
      expect(isAllowed(owner, permission, { ownerUserId: owner.userId })).toBe(true);
    }
  });

  it('keeps organisation and member management with owners', () => {
    const managementPermissions = [
      'organization:update',
      'member:invite',
      'member:changeRole',
      'member:remove',
    ] as const;
    for (const permission of managementPermissions) {
      expect(isAllowed(subject('producer'), permission)).toBe(false);
      expect(isAllowed(subject('owner'), permission)).toBe(true);
    }
  });

  it('lets producers manage the production data', () => {
    expect(isAllowed(subject('producer'), 'production:create')).toBe(true);
    expect(isAllowed(subject('producer'), 'block:delete')).toBe(true);
    expect(isAllowed(subject('producer'), 'equipment:update')).toBe(true);
  });

  it('limits department leads to their own department', () => {
    const lead = subject('department_lead');
    expect(isAllowed(lead, 'block:update', { departmentId: CAMERA })).toBe(true);
    expect(can(lead, 'block:update', { departmentId: SOUND })).toEqual({
      allowed: false,
      reason: 'other-department',
    });
    expect(can(lead, 'block:create', {})).toEqual({ allowed: false, reason: 'other-department' });
    expect(can(lead, 'equipment:delete', { departmentId: null })).toEqual({
      allowed: false,
      reason: 'other-department',
    });
  });

  it('never matches a department lead without a department against a record without one', () => {
    const lead = subject('department_lead', { departmentId: null });
    expect(isAllowed(lead, 'block:update', { departmentId: null })).toBe(false);
  });

  it('keeps department leads out of production-level management', () => {
    const lead = subject('department_lead');
    expect(isAllowed(lead, 'production:create')).toBe(false);
    expect(isAllowed(lead, 'shootDay:update')).toBe(false);
    expect(isAllowed(lead, 'location:update')).toBe(false);
  });

  it('shows crew only the productions they are assigned to', () => {
    const crew = subject('crew');
    expect(isAllowed(crew, 'production:read', { productionId: PRODUCTION_A })).toBe(true);
    expect(can(crew, 'production:read', { productionId: PRODUCTION_B })).toEqual({
      allowed: false,
      reason: 'not-assigned',
    });
    expect(isAllowed(crew, 'location:read', { productionIds: [PRODUCTION_B, PRODUCTION_A] })).toBe(
      true,
    );
    expect(isAllowed(crew, 'location:read', { productionIds: [] })).toBe(false);
  });

  it('lets crew see their own crew record even when unassigned', () => {
    const crew = subject('crew');
    expect(
      isAllowed(crew, 'crewMember:read', { ownerUserId: crew.userId, productionIds: [] }),
    ).toBe(true);
    expect(
      isAllowed(crew, 'crewMember:read', { ownerUserId: 'someone-else', productionIds: [] }),
    ).toBe(false);
  });

  it('allows acknowledging only your own call time, and crew only in assigned productions', () => {
    const crew = subject('crew');
    expect(
      isAllowed(crew, 'block:acknowledge', {
        productionId: PRODUCTION_A,
        ownerUserId: crew.userId,
      }),
    ).toBe(true);
    expect(
      can(crew, 'block:acknowledge', { productionId: PRODUCTION_B, ownerUserId: crew.userId }),
    ).toEqual({ allowed: false, reason: 'not-assigned' });
    expect(
      can(crew, 'block:acknowledge', { productionId: PRODUCTION_A, ownerUserId: 'someone-else' }),
    ).toEqual({ allowed: false, reason: 'not-yours' });
    expect(can(subject('owner'), 'block:acknowledge', { ownerUserId: 'someone-else' })).toEqual({
      allowed: false,
      reason: 'not-yours',
    });
    expect(isAllowed(subject('owner'), 'block:acknowledge', { ownerUserId: 'user-owner' })).toBe(
      true,
    );
  });

  it('keeps viewers read-only with a distinct reason', () => {
    const viewer = subject('viewer');
    expect(isAllowed(viewer, 'production:read')).toBe(true);
    expect(isAllowed(viewer, 'comment:read')).toBe(true);
    expect(can(viewer, 'comment:create')).toEqual({ allowed: false, reason: 'read-only-role' });
    expect(can(viewer, 'block:update')).toEqual({ allowed: false, reason: 'read-only-role' });
  });

  it('lets people delete only their own comments and attachments unless they manage', () => {
    const crew = subject('crew');
    expect(isAllowed(crew, 'comment:delete', { ownerUserId: crew.userId })).toBe(true);
    expect(isAllowed(crew, 'comment:delete', { ownerUserId: 'someone-else' })).toBe(false);
    expect(isAllowed(subject('producer'), 'comment:delete', { ownerUserId: 'someone-else' })).toBe(
      true,
    );
  });
});

describe('policy data', () => {
  it('only grants permissions that exist', () => {
    const known = new Set<string>(PERMISSIONS);
    for (const role of ROLES) {
      for (const granted of Object.keys(GRANTS[role])) {
        expect(known.has(granted)).toBe(true);
      }
    }
  });

  it('gives every role at least organisation read access', () => {
    for (const role of ROLES) {
      expect(isAllowed(subject(role), 'organization:read')).toBe(true);
    }
  });

  it('keeps the generated matrix document in sync with the policy', () => {
    const onDisk = readFileSync(join(process.cwd(), 'docs', 'rbac-matrix.md'), 'utf8');
    expect(onDisk).toBe(renderMatrix());
  });
});
