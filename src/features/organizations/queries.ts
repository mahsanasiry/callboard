import { cache } from 'react';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { ROLES } from '@/lib/permissions/policy';

const membershipSchema = z.object({
  role: z.enum(ROLES),
  department_id: z.string().nullable(),
  organizations: z.object({ id: z.string(), name: z.string(), slug: z.string() }),
});

const productionSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(['planning', 'scheduled', 'shooting', 'wrapped', 'archived']),
  starts_on: z.string().nullable(),
  ends_on: z.string().nullable(),
});

const profileSchema = z.object({ display_name: z.string() });

export interface CurrentMembership {
  readonly role: (typeof ROLES)[number];
  readonly departmentId: string | null;
  readonly organization: { readonly id: string; readonly name: string; readonly slug: string };
}

export type VisibleProduction = z.infer<typeof productionSchema>;

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  return error ? null : data.user;
});

export const getDisplayName = cache(async (userId: string): Promise<string> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', userId)
    .maybeSingle();
  const parsed = profileSchema.safeParse(data);
  return parsed.success ? parsed.data.display_name : '';
});

export const getCurrentMembership = cache(async (): Promise<CurrentMembership | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from('memberships')
    .select('role, department_id, organizations(id, name, slug)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  const parsed = membershipSchema.safeParse(data);
  if (!parsed.success) return null;
  return {
    role: parsed.data.role,
    departmentId: parsed.data.department_id,
    organization: parsed.data.organizations,
  };
});

export async function listVisibleProductions(): Promise<VisibleProduction[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('productions')
    .select('id, name, status, starts_on, ends_on')
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  return z.array(productionSchema).catch([]).parse(data);
}
