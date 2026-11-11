import type { EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { defaultLocale, isLocale } from '@/i18n/locales';
import { DEFAULT_SIGNED_IN_PATH, safeNextPath } from '@/lib/auth/access';
import { createClient } from '@/lib/supabase/server';

const otpTypes = ['signup', 'invite', 'magiclink', 'recovery', 'email_change', 'email'] as const;

const tokenQuerySchema = z.object({
  token_hash: z.string().min(1),
  type: z.enum(otpTypes),
});

/**
 * Handles both ways a confirmation email can arrive:
 * - `code`, which Supabase's own email templates produce (PKCE flow)
 * - `token_hash` and `type`, which custom templates can link to directly
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : defaultLocale;
  const destination = safeNextPath(searchParams.get('next')) ?? DEFAULT_SIGNED_IN_PATH;

  const supabase = await createClient();
  const code = searchParams.get('code');
  let succeeded = false;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    succeeded = !error;
  } else {
    const query = tokenQuerySchema.safeParse({
      token_hash: searchParams.get('token_hash'),
      type: searchParams.get('type'),
    });
    if (query.success) {
      const { error } = await supabase.auth.verifyOtp({
        type: query.data.type as EmailOtpType,
        token_hash: query.data.token_hash,
      });
      succeeded = !error;
    }
  }

  const target = succeeded
    ? `/${locale}${destination}`
    : `/${locale}/login?error=confirmationFailed`;
  return NextResponse.redirect(new URL(target, request.url));
}
