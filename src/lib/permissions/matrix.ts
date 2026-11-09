import { describeGrant, PERMISSIONS, ROLES, type Condition } from './policy';

const CONDITION_LABEL: Record<Condition, string> = {
  department: 'own department',
  assigned: 'assigned productions',
  own: 'own records',
};

function cell(role: (typeof ROLES)[number], permission: (typeof PERMISSIONS)[number]): string {
  const grant = describeGrant(role, permission);
  if (grant === 'yes') return 'Yes';
  if (grant === 'no') return '-';
  return grant
    .map((conditions) => conditions.map((condition) => CONDITION_LABEL[condition]).join(' and '))
    .join(' or ');
}

export function renderMatrix(): string {
  const header = `| Permission | ${ROLES.join(' | ')} |`;
  const divider = `| --- | ${ROLES.map(() => '---').join(' | ')} |`;
  const rows = PERMISSIONS.map(
    (permission) =>
      `| \`${permission}\` | ${ROLES.map((role) => cell(role, permission)).join(' | ')} |`,
  );

  return [
    '# Role and permission matrix',
    '',
    'Generated from `src/lib/permissions/policy.ts` with `pnpm docs:rbac`. Do not edit by hand.',
    '',
    header,
    divider,
    ...rows,
    '',
  ].join('\n');
}
