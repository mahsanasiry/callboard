import { z } from 'zod';

export const PASSWORD_MIN_LENGTH = 10;
// bcrypt, which Supabase uses, ignores everything after 72 bytes.
export const PASSWORD_MAX_LENGTH = 72;

const email = z.string().trim().min(1, 'required').pipe(z.email('email.invalid'));

const newPassword = z
  .string()
  .min(PASSWORD_MIN_LENGTH, 'password.tooShort')
  .max(PASSWORD_MAX_LENGTH, 'password.tooLong');

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'required'),
});

export const signupSchema = z
  .object({
    displayName: z.string().trim().min(1, 'required').max(80, 'name.tooLong'),
    email,
    password: newPassword,
    confirmPassword: z.string().min(1, 'required'),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'password.mismatch',
  });

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    password: newPassword,
    confirmPassword: z.string().min(1, 'required'),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'password.mismatch',
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
