import { cache } from 'react';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { DEFAULT_NOTIFICATION_PREFERENCES, notificationPreferencesSchema } from './schemas';

const rowSchema = z.object({
  display_name: z.string(),
  locale: z.string(),
  time_zone: z.string(),
  is_demo: z.boolean(),
  notification_preferences: z.unknown(),
});

export interface ProfileSettings {
  readonly displayName: string;
  readonly locale: string;
  readonly timeZone: string;
  readonly isDemo: boolean;
  readonly notifications: z.infer<typeof notificationPreferencesSchema>;
}

export const getProfileSettings = cache(async (userId: string): Promise<ProfileSettings | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('display_name, locale, time_zone, is_demo, notification_preferences')
    .eq('id', userId)
    .maybeSingle();

  const row = rowSchema.safeParse(data);
  if (!row.success) return null;

  const notifications = notificationPreferencesSchema.safeParse({
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...(typeof row.data.notification_preferences === 'object'
      ? row.data.notification_preferences
      : {}),
  });

  return {
    displayName: row.data.display_name,
    locale: row.data.locale,
    timeZone: row.data.time_zone,
    isDemo: row.data.is_demo,
    notifications: notifications.success ? notifications.data : DEFAULT_NOTIFICATION_PREFERENCES,
  };
});
