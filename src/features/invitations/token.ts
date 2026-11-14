import { createHash, randomBytes } from 'node:crypto';

export const INVITATION_LIFETIME_DAYS = 14;

/** 256 random bits, safe to put in a URL. */
export function generateInvitationToken(): string {
  return randomBytes(32).toString('base64url');
}

/** Only this hash is stored, so a leaked database does not leak usable links. */
export function hashInvitationToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function invitationLink(origin: string, locale: string, token: string): string {
  return `${origin}/${locale}/invite?token=${encodeURIComponent(token)}`;
}
