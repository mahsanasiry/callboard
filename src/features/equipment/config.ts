import type { ListConfig } from '@/lib/list/state';

export const EQUIPMENT_STATUSES = ['available', 'in_use', 'maintenance', 'retired'] as const;
export const EQUIPMENT_CATEGORIES = [
  'camera',
  'lenses',
  'grip',
  'lighting',
  'sound',
  'art',
  'power',
  'other',
] as const;

export type EquipmentStatus = (typeof EQUIPMENT_STATUSES)[number];
export type EquipmentCategory = (typeof EQUIPMENT_CATEGORIES)[number];

export const equipmentListConfig: ListConfig = {
  sortable: ['name', 'category', 'status', 'updated'],
  defaultSort: { field: 'name', direction: 'asc' },
  filters: {
    status: EQUIPMENT_STATUSES,
    category: EQUIPMENT_CATEGORIES,
    department: null,
    archive: ['only'],
  },
  pageSizes: [25, 50, 100],
  searchMaxLength: 80,
};

export const EQUIPMENT_SORT_COLUMN: Record<string, string> = {
  name: 'name',
  category: 'category',
  status: 'status',
  updated: 'updated_at',
};
