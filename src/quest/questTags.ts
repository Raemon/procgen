export const KEY_TAG_PREFIX = 'key:';
export const DOOR_TAG_PREFIX = 'door:';

export function keyIdOfTag(tag: string): string | null {
  return idAfterPrefix(tag, KEY_TAG_PREFIX);
}

export function doorIdOfTag(tag: string): string | null {
  return idAfterPrefix(tag, DOOR_TAG_PREFIX);
}

export function keyTagFor(id: string): string {
  return KEY_TAG_PREFIX + id;
}

export function doorTagFor(id: string): string {
  return DOOR_TAG_PREFIX + id;
}

export function isQuestTag(tag: string): boolean {
  return keyIdOfTag(tag) !== null || doorIdOfTag(tag) !== null;
}

function idAfterPrefix(tag: string, prefix: string): string | null {
  return tag.startsWith(prefix) && tag.length > prefix.length ? tag.slice(prefix.length) : null;
}
