'use server';

import { randomBytes } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from '@/i18n/navigation';
import { isLocale, defaultLocale } from '@/i18n/locales';
import { fieldErrorsFrom, type ActionResult } from '@/features/auth/result';
import { createClient } from '@/lib/supabase/server';
import { createOrganizationSchema } from './schemas';
import { slugFor } from './slug';

export async function createOrganizationAction(
  input: unknown,
  locale: string,
): Promise<ActionResult> {
  const parsed = createOrganizationSchema.safeParse(input);
  if (!parsed.success) return { status: 'error', fieldErrors: fieldErrorsFrom(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.rpc('create_organization', {
    org_name: parsed.data.name,
    org_slug: slugFor(parsed.data.name, randomBytes(3).toString('hex')),
  });
  if (error) return { status: 'error', formError: 'generic' };

  revalidatePath('/', 'layout');
  redirect({ href: '/dashboard', locale: isLocale(locale) ? locale : defaultLocale });
  return { status: 'ok' };
}
