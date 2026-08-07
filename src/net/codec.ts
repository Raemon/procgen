import type { ClientMsg, ServerMsg } from './protocol';

export function encodeClient(msg: ClientMsg): string {
  return JSON.stringify(msg);
}

export function encodeServer(msg: ServerMsg): string {
  return JSON.stringify(msg);
}

export function decodeClient(data: string): ClientMsg | null {
  return decode(data) as ClientMsg | null;
}

export function decodeServer(data: string): ServerMsg | null {
  return decode(data) as ServerMsg | null;
}

function decode(data: string): unknown {
  let parsed: unknown;
  try {
    parsed = JSON.parse(data);
  } catch {
    return null;
  }
  if (Array.isArray(parsed)) return typeof parsed[0] === 'number' ? parsed : null;
  if (parsed !== null && typeof parsed === 'object' && typeof (parsed as { t?: unknown }).t === 'string') {
    return parsed;
  }
  return null;
}
