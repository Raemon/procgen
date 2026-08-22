import type { ThumbnailDataUrl, WorldKey, WorldThumbnailIndex } from '@/features/app-shell/persistence/persistedDocumentContents';

export type { ThumbnailDataUrl, WorldKey, WorldThumbnailIndex };

export function worldThumbnailIndexFrom(raw: unknown): WorldThumbnailIndex {
  if (typeof raw !== 'object' || raw === null) return {};
  const entries = Object.entries(raw as Record<string, unknown>).filter(
    (entry): entry is [WorldKey, ThumbnailDataUrl] => typeof entry[1] === 'string',
  );
  return Object.fromEntries(entries);
}
