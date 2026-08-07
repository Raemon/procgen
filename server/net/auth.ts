import { createHmac, timingSafeEqual } from 'node:crypto';

const GAME = 'procgen';
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

interface SessionClaims {
  game: string;
  characterId: string;
  exp: number;
}

export function signToken(secret: string, characterId: string): string {
  const claims: SessionClaims = { game: GAME, characterId, exp: Date.now() + TOKEN_TTL_MS };
  const payload = base64Url(Buffer.from(JSON.stringify(claims), 'utf8'));
  const mac = base64Url(createHmac('sha256', secret).update(payload).digest());
  return `${payload}.${mac}`;
}

export function verifyToken(secret: string, token: string): string | null {
  const dot = token.indexOf('.');
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  if (!macMatches(secret, payload, token.slice(dot + 1))) return null;
  return characterIdFromClaims(payload);
}

function macMatches(secret: string, payload: string, mac: string): boolean {
  const expected = base64Url(createHmac('sha256', secret).update(payload).digest());
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function characterIdFromClaims(payload: string): string | null {
  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as SessionClaims;
    if (typeof claims.characterId !== 'string' || typeof claims.exp !== 'number') return null;
    if (claims.exp < Date.now() || claims.game !== GAME) return null;
    return claims.characterId;
  } catch {
    return null;
  }
}

function base64Url(buf: Buffer): string {
  return buf.toString('base64url');
}
