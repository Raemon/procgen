import { assetId } from '@/features/asset-library/asset';
import { persistWorld, type ServerWorld } from '../../agents/api/serverWorld';
import { compactFaceArtOf } from '@/features/asset-library/tiles/storage/compactFaceArtEncode';
import { isCompactFaceArt } from '@/features/asset-library/tiles/storage/compactFaceArtShape';
import { faceArtFromStoredShape } from '@/features/asset-library/tiles/storage/storedFaceArt';
import { blankFacePixels, type CubeFaceArt } from '@/features/asset-library/tiles/tileFaceArt';
import { newTileWithId, type TileDef } from '@/features/asset-library/tiles/tileDef';
import { tilesAsStoredJson, tilesFromStoredJson } from '@/features/asset-library/tiles/tileStorage';
import { faceArtMips } from '@/features/asset-library/tiles/mips/faceArtMips';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';

export function checkTileArtStorageInvariants(check: CheckReporter): void {
  checkEveryFrameAndLayerSurvivesTheCompactForm(check);
  checkArtStoredInTheOldShapeStillLoads(check);
  checkCorruptCompactArtIsDroppedRatherThanDecodedWrong(check);
  checkReloadedArtOwnsItsOwnPixelArrays(check);
  checkSavingTheWorldStoresArtCompactly(check);
}

function checkEveryFrameAndLayerSurvivesTheCompactForm(check: CheckReporter): void {
  const animated = animatedArtWithHeightAndTransparency();
  const reloaded = faceArtFromStoredShape(JSON.parse(JSON.stringify(compactFaceArtOf(animated))));
  check(
    'an animated tile keeps every frame, its relief layer and its frame timing',
    sameArt(reloaded, animated),
  );
  check(
    'unpainted pixels come back as nothing painted, not as a colour',
    reloaded !== null && reloaded.top[1] === null && reloaded.top[0] === '#ff000080',
  );
}

function checkArtStoredInTheOldShapeStillLoads(check: CheckReporter): void {
  const legacySides = blankFacePixels(8);
  legacySides[3] = '#00ff00';
  const upgraded = faceArtFromStoredShape({
    top: blankFacePixels(8),
    sides: legacySides,
    bottom: blankFacePixels(8),
  });
  check(
    'art from before the six faces existed still upgrades rather than vanishing',
    upgraded !== null && upgraded.north[3] === '#00ff00',
  );
}

function checkCorruptCompactArtIsDroppedRatherThanDecodedWrong(check: CheckReporter): void {
  const compact = compactFaceArtOf(animatedArtWithHeightAndTransparency());
  check(
    'a face whose pixels were truncated in storage is refused, not decoded short',
    faceArtFromStoredShape({ ...compact, color: { ...compact.color, top: 'AAAA' } }) === null,
  );
  check(
    'a face pointing past the end of its palette is refused',
    faceArtFromStoredShape({ ...compact, palette: [] }) === null,
  );
  check(
    'a face that is not even base64 is refused',
    faceArtFromStoredShape({ ...compact, color: { ...compact.color, top: '!!!!' } }) === null,
  );
}

function checkReloadedArtOwnsItsOwnPixelArrays(check: CheckReporter): void {
  const tiles = tilesFromStoredJson(JSON.parse(JSON.stringify(tilesAsStoredJson([oneTileCarryingArt()]))))!;
  const tile = tiles.find((candidate) => candidate.faceArt)!;
  const art = tile.faceArt!;
  check(
    'no two faces share one pixel array, so painting one face cannot repaint another',
    art.top !== art.north && art.north !== art.south,
  );
  const mips = faceArtMips(art.top, tile.color);
  art.top = [...art.top];
  check(
    'painting a face gets it new scaled down copies instead of the stale ones',
    faceArtMips(art.top, tile.color) !== mips,
  );
}

function checkSavingTheWorldStoresArtCompactly(check: CheckReporter): void {
  const written = new Map<string, unknown>();
  persistWorld({ write: (name, json) => void written.set(name, json) }, worldSavingOnlyTiles());
  check(
    'saving the world through the agent API stores tile art compactly, not as raw pixels',
    isCompactFaceArt((written.get('tiles') as TileDef[])[0]!.faceArt),
  );
}

function worldSavingOnlyTiles(): ServerWorld {
  const nothing = {
    all: () => [],
    snapshot: () => null,
    savedTemplates: () => [],
    stored: () => ({ seeds: [], hiddenExamples: [] }),
  };
  return {
    ...nothing,
    store: nothing,
    tileAssets: { all: () => [oneTileCarryingArt()] },
    pieces: nothing,
    cultures: nothing,
    creatures: nothing,
    items: nothing,
    templates: nothing,
    worldSeeds: nothing,
    savedWorlds: { stored: () => ({ worlds: [] }) },
    assetFolders: nothing,
    runningWorld: { ref: () => null },
    uiState: {},
  } as unknown as ServerWorld;
}

function sameArt(left: unknown, right: unknown): boolean {
  return withSortedKeys(left) === withSortedKeys(right);
}

function withSortedKeys(value: unknown): string {
  return JSON.stringify(value, (_key, nested) =>
    isPlainObject(nested)
      ? Object.fromEntries(Object.entries(nested).sort(([a], [b]) => (a < b ? -1 : 1)))
      : nested,
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function animatedArtWithHeightAndTransparency(): CubeFaceArt {
  const painted = () => {
    const pixels = blankFacePixels(4);
    pixels[0] = '#ff000080';
    pixels[2] = '#0000ff';
    return pixels;
  };
  return {
    size: 4,
    top: painted(),
    north: painted(),
    east: blankFacePixels(4),
    south: blankFacePixels(4),
    west: blankFacePixels(4),
    bottom: blankFacePixels(4),
    height: { top: painted() },
    frameMs: 240,
    framesAfterFirst: [
      { color: { top: painted() }, height: null },
      { color: { north: painted() }, height: { north: painted() } },
    ],
  };
}

function oneTileCarryingArt(): TileDef {
  return { ...newTileWithId(assetId<'tiles'>(0)), faceArt: animatedArtWithHeightAndTransparency() };
}
