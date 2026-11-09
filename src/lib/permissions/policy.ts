export const ROLES = ['owner', 'producer', 'department_lead', 'crew', 'viewer'] as const;
export type Role = (typeof ROLES)[number];

export const ACTIONS = {
  organization: ['read', 'update'],
  member: ['read', 'invite', 'changeRole', 'remove'],
  production: ['read', 'create', 'update', 'delete'],
  shootDay: ['read', 'create', 'update', 'delete'],
  block: ['read', 'create', 'update', 'delete', 'acknowledge'],
  location: ['read', 'create', 'update', 'delete'],
  crewMember: ['read', 'create', 'update', 'delete'],
  equipment: ['read', 'create', 'update', 'delete'],
  comment: ['read', 'create', 'delete'],
  attachment: ['read', 'upload', 'delete'],
} as const;

export type Resource = keyof typeof ACTIONS;
export type Permission = {
  [R in Resource]: `${R}:${(typeof ACTIONS)[R][number]}`;
}[Resource];

export const PERMISSIONS: readonly Permission[] = (
  Object.entries(ACTIONS) as [Resource, readonly string[]][]
).flatMap(([resource, actions]) => actions.map((action) => `${resource}:${action}` as Permission));

/**
 * Extra requirements that narrow a grant. A grant lists alternatives; each
 * alternative lists conditions that must all hold.
 *
 * - department: the record belongs to the member's own department
 * - assigned: the record belongs to a production the member is assigned to
 * - own: the record was created by, or belongs to, the member
 */
export type Condition = 'department' | 'assigned' | 'own';
type Grant = true | readonly (readonly Condition[])[];

const ALL: Grant = true;

const READ_PERMISSIONS: readonly Permission[] = PERMISSIONS.filter((permission) =>
  permission.endsWith(':read'),
);

function grantAll(permissions: readonly Permission[], grant: Grant = ALL) {
  return Object.fromEntries(permissions.map((permission) => [permission, grant]));
}

const OWNER_ONLY: readonly Permission[] = [
  'organization:update',
  'member:invite',
  'member:changeRole',
  'member:remove',
];

export const GRANTS: Record<Role, Partial<Record<Permission, Grant>>> = {
  owner: { ...grantAll(PERMISSIONS), 'block:acknowledge': [['own']] },

  producer: {
    ...grantAll(PERMISSIONS.filter((permission) => !OWNER_ONLY.includes(permission))),
    'block:acknowledge': [['own']],
  },

  department_lead: {
    ...grantAll(READ_PERMISSIONS),
    'block:create': [['department']],
    'block:update': [['department']],
    'block:delete': [['department']],
    'block:acknowledge': [['own']],
    'equipment:create': [['department']],
    'equipment:update': [['department']],
    'equipment:delete': [['department']],
    'comment:create': ALL,
    'comment:delete': [['own']],
    'attachment:upload': ALL,
    'attachment:delete': [['own']],
  },

  crew: {
    'organization:read': ALL,
    'member:read': [['own']],
    'production:read': [['assigned']],
    'shootDay:read': [['assigned']],
    'block:read': [['assigned']],
    'block:acknowledge': [['assigned', 'own']],
    'location:read': [['assigned']],
    'crewMember:read': [['own'], ['assigned']],
    'equipment:read': [['assigned']],
    'comment:read': [['assigned']],
    'comment:create': [['assigned']],
    'comment:delete': [['own']],
    'attachment:read': [['assigned']],
    'attachment:upload': [['assigned']],
    'attachment:delete': [['own']],
  },

  viewer: grantAll(READ_PERMISSIONS),
};

export interface Subject {
  readonly userId: string;
  readonly role: Role;
  readonly departmentId: string | null;
  readonly assignedProductionIds: ReadonlySet<string>;
}

export interface ResourceContext {
  /** The production the record belongs to. */
  readonly productionId?: string | null;
  /** Productions a shared record (location, equipment, crew member) is used in. */
  readonly productionIds?: readonly string[];
  /** The department the record belongs to. */
  readonly departmentId?: string | null;
  /** The user who created or owns the record. */
  readonly ownerUserId?: string | null;
}

export type DenialReason =
  | 'not-a-member'
  | 'read-only-role'
  | 'role-cannot'
  | 'other-department'
  | 'not-assigned'
  | 'not-yours';

export type Decision =
  { readonly allowed: true } | { readonly allowed: false; readonly reason: DenialReason };

const DENIAL_FOR_CONDITION: Record<Condition, DenialReason> = {
  department: 'other-department',
  assigned: 'not-assigned',
  own: 'not-yours',
};

function holds(condition: Condition, subject: Subject, context: ResourceContext): boolean {
  switch (condition) {
    case 'department':
      return (
        subject.departmentId !== null &&
        context.departmentId !== undefined &&
        context.departmentId === subject.departmentId
      );
    case 'assigned': {
      const productions = [
        ...(context.productionId ? [context.productionId] : []),
        ...(context.productionIds ?? []),
      ];
      return productions.some((id) => subject.assignedProductionIds.has(id));
    }
    case 'own':
      return context.ownerUserId !== undefined && context.ownerUserId === subject.userId;
  }
}

export function can(
  subject: Subject | null,
  permission: Permission,
  context: ResourceContext = {},
): Decision {
  if (!subject) return { allowed: false, reason: 'not-a-member' };

  const grant = GRANTS[subject.role][permission];
  if (grant === undefined) {
    const isWrite = !permission.endsWith(':read');
    return {
      allowed: false,
      reason: subject.role === 'viewer' && isWrite ? 'read-only-role' : 'role-cannot',
    };
  }
  if (grant === true) return { allowed: true };

  let firstFailure: DenialReason = 'role-cannot';
  for (const [index, conditions] of grant.entries()) {
    const failed = conditions.find((condition) => !holds(condition, subject, context));
    if (failed === undefined) return { allowed: true };
    if (index === 0) firstFailure = DENIAL_FOR_CONDITION[failed];
  }
  return { allowed: false, reason: firstFailure };
}

export function isAllowed(
  subject: Subject | null,
  permission: Permission,
  context: ResourceContext = {},
): boolean {
  return can(subject, permission, context).allowed;
}

export function describeGrant(
  role: Role,
  permission: Permission,
): 'yes' | 'no' | readonly Condition[][] {
  const grant = GRANTS[role][permission];
  if (grant === undefined) return 'no';
  if (grant === true) return 'yes';
  return grant.map((conditions) => [...conditions]);
}
