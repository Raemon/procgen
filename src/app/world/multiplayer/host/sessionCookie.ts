import { randomBytes } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import { signToken, verifyToken } from './auth';

const COOKIE_NAME = 'procgenSession';
const COOKIE_TTL_SECONDS = 30 * 24 * 60 * 60;

export function characterIdOfRequest(secret: string, req: IncomingMessage): string | null {
  const token = cookieValueOf(req.headers.cookie ?? '', COOKIE_NAME);
  return token ? verifyToken(secret, token) : null;
}

export function mintCharacterId(): string {
  return 'p_' + randomBytes(9).toString('base64url');
}

export function sessionCookieHeaderFor(secret: string, characterId: string): string {
  const token = signToken(secret, characterId);
  return `Set-Cookie: ${COOKIE_NAME}=${token}; Path=/; Max-Age=${COOKIE_TTL_SECONDS}; HttpOnly; SameSite=Lax`;
}

function cookieValueOf(header: string, name: string): string | null {
  for (const pair of header.split(';')) {
    const at = pair.indexOf('=');
    if (at > 0 && pair.slice(0, at).trim() === name) return pair.slice(at + 1).trim();
  }
  return null;
}
