import type { ZodError } from 'zod';
import { toValidationKey, type ValidationKey } from './validation';

export const FORM_ERROR_KEYS = [
  'invalidCredentials',
  'emailNotConfirmed',
  'rateLimited',
  'weakPassword',
  'signupDisabled',
  'sessionExpired',
  'confirmationFailed',
  'demoUnavailable',
  'generic',
] as const;

export type FormErrorKey = (typeof FORM_ERROR_KEYS)[number];

export type FieldErrors = Partial<Record<string, ValidationKey>>;

export type ActionResult =
  | { readonly status: 'ok' }
  | { readonly status: 'check-email' }
  | {
      readonly status: 'error';
      readonly formError?: FormErrorKey;
      readonly fieldErrors?: FieldErrors;
    };

export function fieldErrorsFrom(error: ZodError): FieldErrors {
  const fieldErrors: FieldErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === 'string' && fieldErrors[field] === undefined) {
      fieldErrors[field] = toValidationKey(issue.message);
    }
  }
  return fieldErrors;
}
