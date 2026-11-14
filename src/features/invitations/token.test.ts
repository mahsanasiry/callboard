import { describe, expect, it } from 'vitest';
import { generateInvitationToken, hashInvitationToken, invitationLink } from './token';

describe('invitation tokens', () => {
  it('are long, URL-safe and different every time', () => {
    const tokens = new Set(Array.from({ length: 50 }, () => generateInvitationToken()));
    expect(tokens.size).toBe(50);
    for (const token of tokens) {
      expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    }
  });

  it('hash to a stable 64 character value that does not contain the token', () => {
    const token = generateInvitationToken();
    const hash = hashInvitationToken(token);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hashInvitationToken(token)).toBe(hash);
    expect(hash).not.toContain(token);
    expect(hashInvitationToken(`${token}x`)).not.toBe(hash);
  });

  it('match a known SHA-256 value', () => {
    expect(hashInvitationToken('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('build a link in the visitor language', () => {
    expect(invitationLink('https://site.test', 'fa', 'a-b_c')).toBe(
      'https://site.test/fa/invite?token=a-b_c',
    );
  });
});
