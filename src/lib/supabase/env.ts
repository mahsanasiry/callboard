import { z } from 'zod';

const publicSchema = z.object({
  url: z.url(),
  publishableKey: z.string().min(20),
});

export type SupabasePublicEnv = z.infer<typeof publicSchema>;

/** Returns null when the project is not configured, so static pages still build. */
export function readSupabaseEnv(): SupabasePublicEnv | null {
  const parsed = publicSchema.safeParse({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
  return parsed.success ? parsed.data : null;
}

export function requireSupabaseEnv(): SupabasePublicEnv {
  const env = readSupabaseEnv();
  if (!env) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local.',
    );
  }
  return env;
}
