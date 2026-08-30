import { jsonOf } from '@/features/app-shell/persistence/persistedDocumentContents';
import { CultureAssets } from '@/features/asset-library/cultures/cultureAssets';
import { culturesFromStoredJson } from '@/features/asset-library/cultures/cultureStorage';
import { PieceAssets } from '@/features/asset-library/pieces/pieceAssets';
import { piecesFromStoredJson } from '@/features/asset-library/pieces/pieceStorage';
import { TileAssets } from '@/features/asset-library/tiles/tileAssets';
import { tilesAsStoredJson, tilesFromStoredJson } from '@/features/asset-library/tiles/tileStorage';
import type { LabInstallTargets } from '@/features/asset-library/worlds/lab/installLabWorldSeed';
import { worldSeedLibraryFromStoredJson } from '@/features/asset-library/worlds/seeds/storedWorldSeedLibrary';
import { WorldSeedLibrary } from '@/features/asset-library/worlds/seeds/worldSeedLibrary';
import { initStore, type Store } from '@/infrastructure/server/persistence/db';
import { createDocStore, saveDoc, type DocStore } from '@/infrastructure/server/persistence/docsRepo';

export type AssetLibraryInTheDatabase = LabInstallTargets;

export async function withTheAssetLibrary(
  change: (library: AssetLibraryInTheDatabase) => boolean,
): Promise<void> {
  const store = await initStore(process.env.DATABASE_URL ?? null);
  const docs = await createDocStore(store);
  const library = libraryHeldBy(docs);
  if (change(library)) await saveLibrary(store, library);
  await store.disconnect();
}

function libraryHeldBy(docs: DocStore): AssetLibraryInTheDatabase {
  return {
    tileAssets: new TileAssets(tilesFromStoredJson(readDoc(docs, 'tiles')) ?? []),
    pieces: new PieceAssets(piecesFromStoredJson(readDoc(docs, 'pieces')) ?? []),
    cultures: new CultureAssets(culturesFromStoredJson(readDoc(docs, 'cultures')) ?? []),
    worldSeeds: new WorldSeedLibrary(worldSeedLibraryFromStoredJson(readDoc(docs, 'worldSeeds'))),
  };
}

async function saveLibrary(store: Store, library: AssetLibraryInTheDatabase): Promise<void> {
  await saveDoc(store, 'tiles', tilesAsStoredJson(library.tileAssets.all()));
  await saveDoc(store, 'pieces', library.pieces.all());
  await saveDoc(store, 'cultures', library.cultures.all());
  await saveDoc(store, 'worldSeeds', library.worldSeeds.stored());
}

function readDoc(docs: DocStore, name: 'tiles' | 'pieces' | 'cultures' | 'worldSeeds'): unknown {
  const held = docs.read(name);
  return held === null ? null : jsonOf(held);
}
