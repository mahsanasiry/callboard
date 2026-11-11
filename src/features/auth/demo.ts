import { z } from 'zod';
import type { Role } from '@/lib/permissions/policy';
import { ROLES } from '@/lib/permissions/policy';

export const DEMO_ROLES: readonly Role[] = ROLES;

const demoEnvSchema = z.object({
  emailTemplate: z
    .string()
    .includes('{role}')
    .refine((value) => z.email().safeParse(value.replaceAll('{role}', 'owner')).success),
  password: z.string().min(12),
});

export interface DemoConfig {
  readonly emailTemplate: string;
  readonly password: string;
}

/** Demo sign-in is offered only when both server-side settings exist. */
export function readDemoConfig(): DemoConfig | null {
  const parsed = demoEnvSchema.safeParse({
    emailTemplate: process.env.DEMO_EMAIL_TEMPLATE,
    password: process.env.DEMO_ACCOUNT_PASSWORD,
  });
  return parsed.success ? parsed.data : null;
}

export function demoEmail(template: string, role: Role): string {
  return template.replaceAll('{role}', role.replaceAll('_', '-'));
}

export function isDemoRole(value: string): value is Role {
  return DEMO_ROLES.some((role) => role === value);
}
