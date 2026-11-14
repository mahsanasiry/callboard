import { describe, expect, it } from 'vitest';
import { fieldErrorsFrom } from '@/features/auth/result';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  NOTIFICATION_TYPES,
  deleteAccountSchema,
  notificationPreferencesSchema,
  profileSchema,
} from './schemas';

const valid = { displayName: 'Ada', locale: 'en', timeZone: 'Asia/Tehran' };

function errors(value: unknown) {
  const result = profileSchema.safeParse(value);
  return result.success ? {} : fieldErrorsFrom(result.error);
}

describe('profileSchema', () => {
  it('accepts a complete profile', () => {
    expect(profileSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts any registered locale and rejects others', () => {
    expect(profileSchema.safeParse({ ...valid, locale: 'fa' }).success).toBe(true);
    expect(errors({ ...valid, locale: 'xx' })).toEqual({ locale: 'invalid' });
  });

  it('knows real time zones from invented ones', () => {
    expect(profileSchema.safeParse({ ...valid, timeZone: 'America/New_York' }).success).toBe(true);
    expect(profileSchema.safeParse({ ...valid, timeZone: 'UTC' }).success).toBe(true);
    expect(errors({ ...valid, timeZone: 'Mars/Olympus' })).toEqual({ timeZone: 'invalid' });
    expect(errors({ ...valid, timeZone: '' })).toEqual({ timeZone: 'invalid' });
  });

  it('requires a name of sensible length', () => {
    expect(errors({ ...valid, displayName: '   ' })).toEqual({ displayName: 'required' });
    expect(errors({ ...valid, displayName: 'x'.repeat(81) })).toEqual({
      displayName: 'name.tooLong',
    });
  });
});

describe('notification preferences', () => {
  it('cover every notification type', () => {
    expect(Object.keys(DEFAULT_NOTIFICATION_PREFERENCES).sort()).toEqual(
      [...NOTIFICATION_TYPES].sort(),
    );
  });

  it('accept booleans only', () => {
    expect(notificationPreferencesSchema.safeParse(DEFAULT_NOTIFICATION_PREFERENCES).success).toBe(
      true,
    );
    expect(
      notificationPreferencesSchema.safeParse({
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        mention: 'yes',
      }).success,
    ).toBe(false);
    expect(notificationPreferencesSchema.safeParse({ assigned: true }).success).toBe(false);
  });
});

describe('deleteAccountSchema', () => {
  it('needs a confirmation', () => {
    expect(deleteAccountSchema.safeParse({ confirmation: '' }).success).toBe(false);
    expect(deleteAccountSchema.safeParse({ confirmation: 'ada@example.com' }).success).toBe(true);
  });
});
