import { describe, expect, it } from 'vitest';
import { fieldErrorsFrom } from './result';
import { forgotPasswordSchema, loginSchema, resetPasswordSchema, signupSchema } from './schemas';
import { toValidationKey } from './validation';

const validSignup = {
  displayName: 'Ada Lovelace',
  email: 'ada@example.com',
  password: 'a-long-enough-password',
  confirmPassword: 'a-long-enough-password',
};

function errorsFor(schema: typeof signupSchema, value: unknown) {
  const result = schema.safeParse(value);
  return result.success ? {} : fieldErrorsFrom(result.error);
}

describe('signupSchema', () => {
  it('accepts a complete sign-up', () => {
    expect(signupSchema.safeParse(validSignup).success).toBe(true);
  });

  it('trims the name and the email', () => {
    const parsed = signupSchema.parse({
      ...validSignup,
      displayName: '  Ada ',
      email: ' ada@example.com ',
    });
    expect(parsed.displayName).toBe('Ada');
    expect(parsed.email).toBe('ada@example.com');
  });

  it('reports each problem on its own field', () => {
    expect(
      errorsFor(signupSchema, {
        displayName: '',
        email: 'nope',
        password: 'short',
        confirmPassword: 'short',
      }),
    ).toEqual({
      displayName: 'required',
      email: 'email.invalid',
      password: 'password.tooShort',
    });
  });

  it('flags a confirmation that does not match, on the confirmation field', () => {
    expect(
      errorsFor(signupSchema, { ...validSignup, confirmPassword: 'something-else-entirely' }),
    ).toEqual({
      confirmPassword: 'password.mismatch',
    });
  });

  it('rejects passwords longer than the hashing limit', () => {
    const long = 'x'.repeat(73);
    expect(
      errorsFor(signupSchema, { ...validSignup, password: long, confirmPassword: long }),
    ).toEqual({
      password: 'password.tooLong',
    });
  });

  it('rejects an over-long name', () => {
    expect(errorsFor(signupSchema, { ...validSignup, displayName: 'n'.repeat(81) })).toEqual({
      displayName: 'name.tooLong',
    });
  });
});

describe('loginSchema', () => {
  it('requires both fields', () => {
    const result = loginSchema.safeParse({ email: '', password: '' });
    expect(result.success ? {} : fieldErrorsFrom(result.error)).toEqual({
      email: 'required',
      password: 'required',
    });
  });

  it('does not enforce the password policy on existing accounts', () => {
    expect(loginSchema.safeParse({ email: 'a@b.co', password: 'x' }).success).toBe(true);
  });
});

describe('forgotPasswordSchema', () => {
  it('needs a valid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'a@b.co' }).success).toBe(true);
    expect(forgotPasswordSchema.safeParse({ email: 'a@' }).success).toBe(false);
  });
});

describe('resetPasswordSchema', () => {
  it('applies the same password rules as sign-up', () => {
    expect(
      resetPasswordSchema.safeParse({ password: 'short', confirmPassword: 'short' }).success,
    ).toBe(false);
    expect(
      resetPasswordSchema.safeParse({
        password: 'a-long-enough-password',
        confirmPassword: 'a-long-enough-password',
      }).success,
    ).toBe(true);
  });
});

describe('toValidationKey', () => {
  it('falls back to a generic key for messages it does not know', () => {
    expect(toValidationKey('Invalid input')).toBe('invalid');
    expect(toValidationKey(undefined)).toBe('invalid');
    expect(toValidationKey('required')).toBe('required');
  });
});
