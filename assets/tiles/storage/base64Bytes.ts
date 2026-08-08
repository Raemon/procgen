const CHARS_PER_APPLY = 0x8000;

export function base64OfBytes(bytes: Uint8Array): string {
  let binary = '';
  for (let at = 0; at < bytes.length; at += CHARS_PER_APPLY)
    binary += String.fromCharCode(...bytes.subarray(at, at + CHARS_PER_APPLY));
  return btoa(binary);
}

export function bytesOfBase64(text: string): Uint8Array | null {
  const binary = binaryStringOrNull(text);
  if (binary === null) return null;
  const bytes = new Uint8Array(binary.length);
  for (let at = 0; at < binary.length; at += 1) bytes[at] = binary.charCodeAt(at);
  return bytes;
}

function binaryStringOrNull(text: string): string | null {
  try {
    return atob(text);
  } catch {
    return null;
  }
}
