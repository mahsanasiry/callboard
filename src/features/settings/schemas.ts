import { z } from 'zod';
import { locales } from '@/i18n/locales';

function isTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat('en', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export const NOTIFICATION_TYPES = [
  'assigned',
  'callTimeChanged',
  'conflict',
  'mention',
  'attachment',
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const profileSchema = z.object({
  displayName: z.string().trim().min(1, 'required').max(80, 'name.tooLong'),
  locale: z.enum(locales as [string, ...string[]], 'invalid'),
  timeZone: z.string().refine(isTimeZone, 'invalid'),
});

export const notificationPreferencesSchema = z.object({
  assigned: z.boolean(),
  callTimeChanged: z.boolean(),
  conflict: z.boolean(),
  mention: z.boolean(),
  attachment: z.boolean(),
});

export const deleteAccountSchema = z.object({
  confirmation: z.string().trim().min(1, 'required'),
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  assigned: true,
  callTimeChanged: true,
  conflict: true,
  mention: true,
  attachment: true,
};
