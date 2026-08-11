import { readPersistedFile, writePersistedFile } from '../frontend/persistence/repoFileStore';
import { requestWorldViewSnapshot } from '../world/render/worldViewSnapshot';

const FILE_NAME = 'worldThumbnails';
const THUMBNAIL_PX = 64;
const LONG_ENOUGH_FOR_THE_WORLD_TO_SETTLE_MS = 900;

class WorldThumbnails {
  private byWorldKey: Record<string, string> = storedThumbnails();
  private readonly listeners = new Set<() => void>();

  of(worldKey: string): string | null {
    return this.byWorldKey[worldKey] ?? null;
  }

  capture(worldKey: string): void {
    requestWorldViewSnapshot(THUMBNAIL_PX, (dataUrl) => this.keep(worldKey, dataUrl));
  }

  captureOnceTheWorldSettles(worldKey: string): void {
    setTimeout(() => this.capture(worldKey), LONG_ENOUGH_FOR_THE_WORLD_TO_SETTLE_MS);
  }

  copy(fromWorldKey: string, toWorldKey: string): void {
    const thumbnail = this.of(fromWorldKey);
    if (thumbnail) this.keep(toWorldKey, thumbnail);
  }

  forget(worldKey: string): void {
    if (!(worldKey in this.byWorldKey)) return;
    const { [worldKey]: dropped, ...rest } = this.byWorldKey;
    this.byWorldKey = rest;
    this.persistAndNotify();
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private keep(worldKey: string, dataUrl: string): void {
    this.byWorldKey = { ...this.byWorldKey, [worldKey]: dataUrl };
    this.persistAndNotify();
  }

  private persistAndNotify(): void {
    writePersistedFile(FILE_NAME, this.byWorldKey);
    for (const listener of this.listeners) listener();
  }
}

function storedThumbnails(): Record<string, string> {
  const stored = readPersistedFile<unknown>(FILE_NAME);
  if (typeof stored !== 'object' || stored === null) return {};
  return Object.fromEntries(
    Object.entries(stored as Record<string, unknown>).filter(
      ([, thumbnail]) => typeof thumbnail === 'string',
    ) as [string, string][],
  );
}

export const worldThumbnails = new WorldThumbnails();
