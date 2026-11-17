import { z } from 'zod';
import { rangeFor, type ListState } from '@/lib/list/state';
import { createClient } from '@/lib/supabase/server';
import { EQUIPMENT_CATEGORIES, EQUIPMENT_SORT_COLUMN, EQUIPMENT_STATUSES } from './config';

const rowSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  status: z.enum(EQUIPMENT_STATUSES),
  asset_tag: z.string().nullable(),
  department_id: z.string().nullable(),
  notes: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable(),
});

export type EquipmentRow = z.infer<typeof rowSchema>;

const COLUMNS =
  'id, name, category, status, asset_tag, department_id, notes, updated_at, deleted_at';

/** Characters that mean something inside a PostgREST filter or a LIKE pattern. */
export function escapeSearch(text: string): string {
  return text
    .replace(/[\\%_,()*"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function listEquipment(
  state: ListState,
): Promise<{ rows: EquipmentRow[]; total: number }> {
  const supabase = await createClient();
  let query = supabase.from('equipment_items').select(COLUMNS, { count: 'exact' });

  query = state.filters.archive?.includes('only')
    ? query.not('deleted_at', 'is', null)
    : query.is('deleted_at', null);

  const search = escapeSearch(state.query);
  if (search) query = query.or(`name.ilike.%${search}%,asset_tag.ilike.%${search}%`);

  if (state.filters.status) query = query.in('status', state.filters.status);
  if (state.filters.category) query = query.in('category', state.filters.category);
  if (state.filters.department) query = query.in('department_id', state.filters.department);

  const column = EQUIPMENT_SORT_COLUMN[state.sort.field] ?? 'name';
  const { from, to } = rangeFor(state);
  const { data, count } = await query
    .order(column, { ascending: state.sort.direction === 'asc' })
    .order('name', { ascending: true })
    .order('id', { ascending: true })
    .range(from, to);

  return { rows: z.array(rowSchema).catch([]).parse(data), total: count ?? 0 };
}

export async function getEquipment(id: string): Promise<EquipmentRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('equipment_items')
    .select(COLUMNS)
    .eq('id', id)
    .maybeSingle();
  const parsed = rowSchema.safeParse(data);
  return parsed.success ? parsed.data : null;
}

export async function isEquipmentNameFree(name: string, exceptId: string | null): Promise<boolean> {
  const supabase = await createClient();
  let query = supabase
    .from('equipment_items')
    .select('id', { count: 'exact', head: true })
    .is('deleted_at', null)
    .ilike(
      'name',
      name.replace(/[\\%_]/g, (character) => `\\${character}`),
    );
  if (exceptId) query = query.neq('id', exceptId);
  const { count } = await query;
  return (count ?? 0) === 0;
}

export function isKnownCategory(value: string): value is (typeof EQUIPMENT_CATEGORIES)[number] {
  return EQUIPMENT_CATEGORIES.some((category) => category === value);
}
