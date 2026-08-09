import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

export function filesUnder(root: string, matches: (path: string) => boolean): string[] {
  if (!isDirectory(root)) return [];
  return readdirSync(root).flatMap((entry) => {
    const path = join(root, entry);
    if (statSync(path).isDirectory()) return filesUnder(path, matches);
    return matches(path) ? [path] : [];
  });
}

export function endingIn(...extensions: readonly string[]): (path: string) => boolean {
  return (path) => extensions.some((extension) => path.endsWith(extension));
}

export function everyFile(): (path: string) => boolean {
  return () => true;
}

export function isDirectory(root: string): boolean {
  try {
    return statSync(root).isDirectory();
  } catch {
    return false;
  }
}
