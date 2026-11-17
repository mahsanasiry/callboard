import { z } from 'zod';
import { emailField } from '@/features/auth/schemas';

const optionalEmail = z.union([z.literal(''), emailField]);

export const crewSchema = z.object({
  fullName: z.string().trim().min(1, 'required').max(160, 'text.tooLong'),
  roleTitle: z.string().trim().max(120, 'text.tooLong'),
  departmentId: z.uuid().nullable(),
  email: optionalEmail,
  phone: z.string().trim().max(40, 'text.tooLong'),
  preferredLocale: z.string().trim().min(2, 'required').max(12, 'text.tooLong'),
  notes: z.string().trim().max(2000, 'text.tooLong'),
});

export type CrewInput = z.infer<typeof crewSchema>;
export const crewIdSchema = z.object({ id: z.uuid() });
