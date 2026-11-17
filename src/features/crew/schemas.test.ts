import { describe, expect, it } from 'vitest';
import { fieldErrorsFrom } from '@/features/auth/result';
import { crewSchema } from './schemas';

const valid = {
  fullName: 'Anika Sorensen',
  roleTitle: 'Director of Photography',
  departmentId: null,
  email: 'anika@example.test',
  phone: '+1 555 0100',
  preferredLocale: 'en',
  notes: '',
};

function errors(value: unknown) {
  const result = crewSchema.safeParse(value);
  return result.success ? {} : fieldErrorsFrom(result.error);
}

describe('crewSchema', () => {
  it('accepts a complete record', () => {
    expect(crewSchema.safeParse(valid).success).toBe(true);
  });

  it('lets the email be left empty but not be malformed', () => {
    expect(crewSchema.safeParse({ ...valid, email: '' }).success).toBe(true);
    expect(errors({ ...valid, email: 'not-an-email' })).toEqual({ email: 'email.invalid' });
  });

  it('needs a name', () => {
    expect(errors({ ...valid, fullName: '  ' })).toEqual({ fullName: 'required' });
  });

  it('limits text length', () => {
    expect(errors({ ...valid, roleTitle: 'x'.repeat(121) })).toEqual({ roleTitle: 'text.tooLong' });
    expect(errors({ ...valid, phone: '1'.repeat(41) })).toEqual({ phone: 'text.tooLong' });
  });

  it('needs a preferred language such as en or pt-BR', () => {
    expect(crewSchema.safeParse({ ...valid, preferredLocale: 'pt-BR' }).success).toBe(true);
    expect(errors({ ...valid, preferredLocale: '' })).toEqual({ preferredLocale: 'required' });
  });
});
