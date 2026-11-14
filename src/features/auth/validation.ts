/**
 * Validation messages are keys, not sentences, so the same schema can run on
 * the client and the server and each side shows the message in the visitor's
 * language.
 */
export const VALIDATION_KEYS = [
  'required',
  'invalid',
  'email.invalid',
  'name.tooLong',
  'password.tooShort',
  'password.tooLong',
  'password.mismatch',
  'organization.tooLong',
  'confirmation.mismatch',
  'department.required',
] as const;

export type ValidationKey = (typeof VALIDATION_KEYS)[number];

export function toValidationKey(message: string | undefined): ValidationKey {
  return VALIDATION_KEYS.find((key) => key === message) ?? 'invalid';
}
