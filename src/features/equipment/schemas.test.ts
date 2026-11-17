import { describe, expect, it } from 'vitest';
import { fieldErrorsFrom } from '@/features/auth/result';
import { equipmentSchema } from './schemas';

const valid = {
  name: 'Cine Camera A',
  category: 'camera',
  status: 'available',
  departmentId: null,
  assetTag: 'CAM-001',
  notes: '',
};

function errors(value: unknown) {
  const result = equipmentSchema.safeParse(value);
  return result.success ? {} : fieldErrorsFrom(result.error);
}

describe('equipmentSchema', () => {
  it('accepts a complete item and trims the text', () => {
    const parsed = equipmentSchema.parse({ ...valid, name: '  Cine Camera A ', notes: ' ok ' });
    expect(parsed.name).toBe('Cine Camera A');
    expect(parsed.notes).toBe('ok');
  });

  it('needs a name', () => {
    expect(errors({ ...valid, name: '   ' })).toEqual({ name: 'required' });
  });

  it('limits the length of every free text field', () => {
    expect(errors({ ...valid, name: 'x'.repeat(161) })).toEqual({ name: 'text.tooLong' });
    expect(errors({ ...valid, assetTag: 'x'.repeat(61) })).toEqual({ assetTag: 'text.tooLong' });
    expect(errors({ ...valid, notes: 'x'.repeat(2001) })).toEqual({ notes: 'text.tooLong' });
  });

  it('only accepts known categories and statuses', () => {
    expect(errors({ ...valid, category: 'furniture' })).toEqual({ category: 'required' });
    expect(errors({ ...valid, status: 'lost' })).toEqual({ status: 'required' });
  });

  it('takes a department id or none', () => {
    expect(
      equipmentSchema.safeParse({ ...valid, departmentId: '11111111-1111-4111-8111-111111111111' })
        .success,
    ).toBe(true);
    expect(equipmentSchema.safeParse({ ...valid, departmentId: 'camera' }).success).toBe(false);
  });
});
