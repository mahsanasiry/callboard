# Role and permission matrix

Generated from `src/lib/permissions/policy.ts` with `pnpm docs:rbac`. Do not edit by hand.

| Permission | owner | producer | department_lead | crew | viewer |
| --- | --- | --- | --- | --- | --- |
| `organization:read` | Yes | Yes | Yes | Yes | Yes |
| `organization:update` | Yes | - | - | - | - |
| `member:read` | Yes | Yes | Yes | own records | Yes |
| `member:invite` | Yes | - | - | - | - |
| `member:changeRole` | Yes | - | - | - | - |
| `member:remove` | Yes | - | - | - | - |
| `production:read` | Yes | Yes | Yes | assigned productions | Yes |
| `production:create` | Yes | Yes | - | - | - |
| `production:update` | Yes | Yes | - | - | - |
| `production:delete` | Yes | Yes | - | - | - |
| `shootDay:read` | Yes | Yes | Yes | assigned productions | Yes |
| `shootDay:create` | Yes | Yes | - | - | - |
| `shootDay:update` | Yes | Yes | - | - | - |
| `shootDay:delete` | Yes | Yes | - | - | - |
| `block:read` | Yes | Yes | Yes | assigned productions | Yes |
| `block:create` | Yes | Yes | own department | - | - |
| `block:update` | Yes | Yes | own department | - | - |
| `block:delete` | Yes | Yes | own department | - | - |
| `block:acknowledge` | own records | own records | own records | assigned productions and own records | - |
| `location:read` | Yes | Yes | Yes | assigned productions | Yes |
| `location:create` | Yes | Yes | - | - | - |
| `location:update` | Yes | Yes | - | - | - |
| `location:delete` | Yes | Yes | - | - | - |
| `crewMember:read` | Yes | Yes | Yes | own records or assigned productions | Yes |
| `crewMember:create` | Yes | Yes | - | - | - |
| `crewMember:update` | Yes | Yes | - | - | - |
| `crewMember:delete` | Yes | Yes | - | - | - |
| `equipment:read` | Yes | Yes | Yes | assigned productions | Yes |
| `equipment:create` | Yes | Yes | own department | - | - |
| `equipment:update` | Yes | Yes | own department | - | - |
| `equipment:delete` | Yes | Yes | own department | - | - |
| `comment:read` | Yes | Yes | Yes | assigned productions | Yes |
| `comment:create` | Yes | Yes | Yes | assigned productions | - |
| `comment:delete` | Yes | Yes | own records | own records | - |
| `attachment:read` | Yes | Yes | Yes | assigned productions | Yes |
| `attachment:upload` | Yes | Yes | Yes | assigned productions | - |
| `attachment:delete` | Yes | Yes | own records | own records | - |
