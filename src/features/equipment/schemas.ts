import { z } from 'zod';
import { EQUIPMENT_CATEGORIES, EQUIPMENT_STATUSES } from './config';

export const equipmentSchema = z.object({
  name: z.string().trim().min(1, 'required').max(160, 'text.tooLong'),
  category: z.enum(EQUIPMENT_CATEGORIES, 'required'),
  status: z.enum(EQUIPMENT_STATUSES, 'required'),
  departmentId: z.uuid().nullable(),
  assetTag: z.string().trim().max(60, 'text.tooLong'),
  notes: z.string().trim().max(2000, 'text.tooLong'),
});

export type EquipmentInput = z.infer<typeof equipmentSchema>;

export const idSchema = z.object({ id: z.uuid() });
export const nameCheckSchema = z.object({
  name: z.string().trim().min(1).max(160),
  exceptId: z.uuid().nullable(),
});
