import {
  worldSeedThumbnailIndexFrom,
  type ThumbnailDataUrl,
  type WorldSeedKey,
  type WorldSeedThumbnailIndex,
} from './worldSeedThumbnailIndex';
import { readPersistedFile, writePersistedFile } from '@/features/app-shell/persistence/repoFileStore';
import { requestWorldViewSnapshot } from '@/features/game/render/worldViewSnapshot';

const FILE_NAME = 'worldSeedThumbnails';
const THUMBNAIL_PX = 64;
const LONG_ENOUGH_FOR_THE_WORLD_TO_SETTLE_MS = 900;

class WorldSeedThumbnails {
  private byWorldSeedKey: WorldSeedThumbnailIndex = storedThumbnails();
  private readonly listeners = new Set<() => void>();

  of(worldSeedKey: WorldSeedKey): ThumbnailDataUrl | null {
    return this.byWorldSeedKey[worldSeedKey] ?? null;
  }

  capture(worldSeedKey: WorldSeedKey): void {
    requestWorldViewSnapshot(THUMBNAIL_PX, (dataUrl) => this.keep(worldSeedKey, dataUrl));
  }

  captureOnceTheWorldSettles(worldSeedKey: WorldSeedKey): void {
    setTimeout(() => this.capture(worldSeedKey), LONG_ENOUGH_FOR_THE_WORLD_TO_SETTLE_MS);
  }

  copy(fromWorldSeedKey: WorldSeedKey, toWorldSeedKey: WorldSeedKey): void {
    const thumbnail = this.of(fromWorldSeedKey);
    if (thumbnail) this.keep(toWorldSeedKey, thumbnail);
  }

  forget(worldSeedKey: WorldSeedKey): void {
    if (!(worldSeedKey in this.byWorldSeedKey)) return;
    const { [worldSeedKey]: dropped, ...rest } = this.byWorldSeedKey;
    this.byWorldSeedKey = rest;
    this.persistAndNotify();
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private keep(worldSeedKey: WorldSeedKey, dataUrl: ThumbnailDataUrl): void {
    this.byWorldSeedKey = { ...this.byWorldSeedKey, [worldSeedKey]: dataUrl };
    this.persistAndNotify();
  }

  private persistAndNotify(): void {
    writePersistedFile(FILE_NAME, this.byWorldSeedKey);
    for (const listener of this.listeners) listener();
  }
}

function storedThumbnails(): WorldSeedThumbnailIndex {
  return worldSeedThumbnailIndexFrom(readPersistedFile<unknown>(FILE_NAME));
}

export const worldSeedThumbnails = new WorldSeedThumbnails();
