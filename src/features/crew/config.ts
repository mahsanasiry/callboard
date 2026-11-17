import type { ListConfig } from '@/lib/list/state';

export const crewListConfig: ListConfig = {
  sortable: ['name', 'title', 'updated'],
  defaultSort: { field: 'name', direction: 'asc' },
  filters: { department: null, locale: null, archive: ['only'] },
  pageSizes: [25, 50, 100],
  searchMaxLength: 80,
};

export const CREW_SORT_COLUMN: Record<string, string> = {
  name: 'full_name',
  title: 'role_title',
  updated: 'updated_at',
};
