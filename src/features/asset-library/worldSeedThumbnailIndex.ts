import type { ThumbnailDataUrl, WorldSeedKey, WorldSeedThumbnailIndex } from '@/features/app-shell/persistence/persistedDocumentContents';

export type { ThumbnailDataUrl, WorldSeedKey, WorldSeedThumbnailIndex };

export function worldSeedThumbnailIndexFrom(raw: unknown): WorldSeedThumbnailIndex {
  if (typeof raw !== 'object' || raw === null) return {};
  const entries = Object.entries(raw as Record<string, unknown>).filter(
    (entry): entry is [WorldSeedKey, ThumbnailDataUrl] => typeof entry[1] === 'string',
  );
  return Object.fromEntries(entries);
}
