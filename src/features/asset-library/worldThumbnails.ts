import {
  worldThumbnailIndexFrom,
  type ThumbnailDataUrl,
  type WorldKey,
  type WorldThumbnailIndex,
} from './worldThumbnailIndex';
import { readPersistedFile, writePersistedFile } from '@/features/app-shell/persistence/repoFileStore';
import { requestWorldViewSnapshot } from '@/features/game/render/worldViewSnapshot';

const FILE_NAME = 'worldThumbnails';
const THUMBNAIL_PX = 64;
const LONG_ENOUGH_FOR_THE_WORLD_TO_SETTLE_MS = 900;

class WorldThumbnails {
  private byWorldKey: WorldThumbnailIndex = storedThumbnails();
  private readonly listeners = new Set<() => void>();

  of(worldKey: WorldKey): ThumbnailDataUrl | null {
    return this.byWorldKey[worldKey] ?? null;
  }

  capture(worldKey: WorldKey): void {
    requestWorldViewSnapshot(THUMBNAIL_PX, (dataUrl) => this.keep(worldKey, dataUrl));
  }

  captureOnceTheWorldSettles(worldKey: WorldKey): void {
    setTimeout(() => this.capture(worldKey), LONG_ENOUGH_FOR_THE_WORLD_TO_SETTLE_MS);
  }

  copy(fromWorldKey: WorldKey, toWorldKey: WorldKey): void {
    const thumbnail = this.of(fromWorldKey);
    if (thumbnail) this.keep(toWorldKey, thumbnail);
  }

  forget(worldKey: WorldKey): void {
    if (!(worldKey in this.byWorldKey)) return;
    const { [worldKey]: dropped, ...rest } = this.byWorldKey;
    this.byWorldKey = rest;
    this.persistAndNotify();
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private keep(worldKey: WorldKey, dataUrl: ThumbnailDataUrl): void {
    this.byWorldKey = { ...this.byWorldKey, [worldKey]: dataUrl };
    this.persistAndNotify();
  }

  private persistAndNotify(): void {
    writePersistedFile(FILE_NAME, this.byWorldKey);
    for (const listener of this.listeners) listener();
  }
}

function storedThumbnails(): WorldThumbnailIndex {
  return worldThumbnailIndexFrom(readPersistedFile<unknown>(FILE_NAME));
}

export const worldThumbnails = new WorldThumbnails();
