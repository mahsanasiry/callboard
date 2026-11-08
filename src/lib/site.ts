import { z } from 'zod';

const siteUrlSchema = z.url().default('http://localhost:3000');

export const siteUrl = siteUrlSchema.parse(process.env.NEXT_PUBLIC_SITE_URL || undefined);
