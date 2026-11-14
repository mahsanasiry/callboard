import { cache } from 'react';
import { getCurrentMembership, getCurrentUser } from '@/features/organizations/queries';
import { createClient } from '@/lib/supabase/server';
import { can, type Decision, type Permission, type ResourceContext, type Subject } from './policy';

export const getSubject = cache(async (): Promise<Subject | null> => {
  const [user, membership] = await Promise.all([getCurrentUser(), getCurrentMembership()]);
  if (!user || !membership) return null;

  const assignedProductionIds = new Set<string>();
  if (membership.role === 'crew') {
    const supabase = await createClient();
    const { data } = await supabase.from('production_crew').select('production_id');
    for (const row of (data ?? []) as { production_id: string }[]) {
      assignedProductionIds.add(row.production_id);
    }
  }

  return {
    userId: user.id,
    role: membership.role,
    departmentId: membership.departmentId,
    assignedProductionIds,
  };
});

/** The same decision the database will make, asked early so the person gets a clear answer. */
export async function authorize(
  permission: Permission,
  context: ResourceContext = {},
): Promise<Decision> {
  return can(await getSubject(), permission, context);
}
