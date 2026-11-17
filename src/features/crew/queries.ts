import { z } from 'zod';
import { escapeSearch } from '@/features/equipment/queries';
import { rangeFor, type ListState } from '@/lib/list/state';
import { createClient } from '@/lib/supabase/server';
import { CREW_SORT_COLUMN } from './config';

const rowSchema = z.object({
  id: z.string(),
  full_name: z.string(),
  role_title: z.string(),
  department_id: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  preferred_locale: z.string(),
  notes: z.string(),
  user_id: z.string().nullable(),
  updated_at: z.string(),
  deleted_at: z.string().nullable(),
});

export type CrewRow = z.infer<typeof rowSchema>;

const COLUMNS =
  'id, full_name, role_title, department_id, email, phone, preferred_locale, notes, user_id, updated_at, deleted_at';

export async function listCrew(state: ListState): Promise<{ rows: CrewRow[]; total: number }> {
  const supabase = await createClient();
  let query = supabase.from('crew_members').select(COLUMNS, { count: 'exact' });

  query = state.filters.archive?.includes('only')
    ? query.not('deleted_at', 'is', null)
    : query.is('deleted_at', null);

  const search = escapeSearch(state.query);
  if (search) {
    query = query.or(
      `full_name.ilike.%${search}%,role_title.ilike.%${search}%,email.ilike.%${search}%`,
    );
  }
  if (state.filters.department) query = query.in('department_id', state.filters.department);
  if (state.filters.locale) query = query.in('preferred_locale', state.filters.locale);

  const column = CREW_SORT_COLUMN[state.sort.field] ?? 'full_name';
  const { from, to } = rangeFor(state);
  const { data, count } = await query
    .order(column, { ascending: state.sort.direction === 'asc' })
    .order('full_name', { ascending: true })
    .order('id', { ascending: true })
    .range(from, to);

  return { rows: z.array(rowSchema).catch([]).parse(data), total: count ?? 0 };
}

export async function getCrewMember(id: string): Promise<CrewRow | null> {
  const supabase = await createClient();
  const { data } = await supabase.from('crew_members').select(COLUMNS).eq('id', id).maybeSingle();
  const parsed = rowSchema.safeParse(data);
  return parsed.success ? parsed.data : null;
}

/** The languages the crew list actually contains, for the language filter. */
export async function listCrewLocales(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('crew_members')
    .select('preferred_locale')
    .is('deleted_at', null);
  const rows = z
    .array(z.object({ preferred_locale: z.string() }))
    .catch([])
    .parse(data);
  return [...new Set(rows.map((row) => row.preferred_locale))].sort();
}
