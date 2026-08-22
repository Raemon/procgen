import { assetId } from '@/features/asset-library/asset';
import { generateAssetKit, type AssetKit, type AssetLibrary } from '@/features/asset-library/generation/assetKit';
import { defaultCultures } from '@/features/asset-library/cultures/defaultCultures';
import { defaultPieces } from '@/features/asset-library/pieces/defaultPieces';
import { EMPTY_VOXEL, VOXEL_FACING_COUNT, type Piece } from '@/features/asset-library/pieces/pieceDef';
import { MATERIAL_SYNTHS } from '@/features/asset-library/textures/materialCatalog';
import { defaultTiles } from '@/features/asset-library/tiles/defaultTiles';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';

const SAMPLED_SEEDS = [0, 7, 1234, 90210];

export function checkGeneratedAssetInvariants(check: CheckReporter): void {
  const kits = SAMPLED_SEEDS.map(kitFromDefaults);
  checkSeedsDecideEverything(check, kits);
  checkNamesReadLikeAuthoredNames(check, kits);
  checkTexturesAreMaterialsThatExist(check, kits);
  checkPiecesStayInsideTheirKit(check, kits);
  checkCulturesBindOnlyTheirOwnKit(check, kits);
}

function checkSeedsDecideEverything(check: CheckReporter, kits: readonly AssetKit[]): void {
  check(
    'generating from one seed twice yields the same kit, so a kit is a pure function of its seed',
    SAMPLED_SEEDS.every((seed) => sameJson(kitFromDefaults(seed), kitFromDefaults(seed))),
  );
  check(
    'different seeds yield different kits, so the generator is not returning one fixed answer',
    new Set(kits.map((kit) => JSON.stringify(kit))).size === kits.length,
  );
  check(
    'every kit brings a full building set of tiles, pieces and one culture',
    kits.every((kit) => kit.tiles.length >= 12 && kit.pieces.length >= 9 && kit.culture.id >= 0),
  );
}

function checkNamesReadLikeAuthoredNames(check: CheckReporter, kits: readonly AssetKit[]): void {
  check(
    'generated names are lowercase and carry no digits or copy suffix, so they read as authored',
    kits.flatMap(everyNameOf).every(readsLikeAnAuthoredName),
  );
  check(
    'no generated name repeats another name in the same kit or in the catalog it was built against',
    kits.every(namesAreFreshWithin),
  );
  check(
    'every generated tile symbol is a single glyph the catalog was not already using',
    kits.every(symbolsAreFreshWithin),
  );
}

function checkTexturesAreMaterialsThatExist(check: CheckReporter, kits: readonly AssetKit[]): void {
  const materialIds = new Set(MATERIAL_SYNTHS.map((material) => material.id));
  check(
    'every generated tile points at a material the texture baker can synthesize',
    kits.every((kit) => kit.tiles.every((tile) => materialIds.has(tile.textureId ?? ''))),
  );
}

function checkPiecesStayInsideTheirKit(check: CheckReporter, kits: readonly AssetKit[]): void {
  check(
    'every painted voxel of a generated piece names a tile from the same kit',
    kits.every((kit) => kit.pieces.every((piece) => voxelsComeFrom(piece, tileIdsOf(kit)))),
  );
  check(
    'a generated piece carries exactly one voxel and one facing per cell of its box',
    kits.every((kit) => kit.pieces.every(arraysMatchTheBox)),
  );
  check(
    'every generated facing is one of the four quarter turns',
    kits.every((kit) => kit.pieces.every((piece) => piece.facings.every(isAQuarterTurn))),
  );
}

function checkCulturesBindOnlyTheirOwnKit(check: CheckReporter, kits: readonly AssetKit[]): void {
  check(
    'a generated culture binds only the pieces its own kit generated',
    kits.every((kit) => boundPieceIdsOf(kit).every((id) => pieceIdsOf(kit).has(id))),
  );
  check(
    'a generated culture paints itself with tiles from its own kit',
    kits.every((kit) => cultureTileIdsOf(kit).every((id) => tileIdsOf(kit).has(id))),
  );
}

function kitFromDefaults(seed: number): AssetKit {
  return generateAssetKit(seed, libraryOfDefaults());
}

function libraryOfDefaults(): AssetLibrary {
  const tiles = defaultTiles();
  return {
    tileNames: tiles.map((tile) => tile.name),
    tileSymbols: tiles.map((tile) => tile.symbol),
    cultureNames: defaultCultures().map((culture) => culture.name),
    nextTileId: assetId<'tiles'>(tiles.length),
    nextPieceId: assetId<'pieces'>(defaultPieces().length),
    nextCultureId: assetId<'cultures'>(defaultCultures().length),
  };
}

function everyNameOf(kit: AssetKit): string[] {
  return [kit.name, ...kit.tiles.map((tile) => tile.name), ...kit.pieces.map((piece) => piece.name)];
}

function readsLikeAnAuthoredName(name: string): boolean {
  return (
    name.length > 0 &&
    name === name.toLowerCase() &&
    !/[0-9]/.test(name) &&
    !name.includes('copy')
  );
}

function namesAreFreshWithin(kit: AssetKit): boolean {
  const tileNames = [...defaultTiles().map((tile) => tile.name), ...kit.tiles.map((t) => t.name)];
  const pieceNames = [...defaultPieces().map((piece) => piece.name), ...kit.pieces.map((p) => p.name)];
  return isAllDistinct(tileNames) && isAllDistinct(pieceNames);
}

function symbolsAreFreshWithin(kit: AssetKit): boolean {
  const symbols = [...defaultTiles().map((tile) => tile.symbol), ...kit.tiles.map((t) => t.symbol)];
  return isAllDistinct(symbols) && kit.tiles.every((tile) => [...tile.symbol].length === 1);
}

function isAllDistinct(values: readonly string[]): boolean {
  return new Set(values).size === values.length;
}

function tileIdsOf(kit: AssetKit): Set<number> {
  return new Set(kit.tiles.map((tile) => tile.id));
}

function pieceIdsOf(kit: AssetKit): Set<number> {
  return new Set(kit.pieces.map((piece) => piece.id));
}

function boundPieceIdsOf(kit: AssetKit): number[] {
  return Object.values(kit.culture.roleBindings).flat();
}

function cultureTileIdsOf(kit: AssetKit): number[] {
  const culture = kit.culture;
  return [
    culture.wallTileId,
    culture.trimTileId,
    culture.roofSlopeTileId,
    culture.roofRidgeTileId,
    culture.floorTileId,
    culture.pathTileId,
  ];
}

function voxelsComeFrom(piece: Piece, tileIds: ReadonlySet<number>): boolean {
  return piece.voxels.every((voxel) => voxel === EMPTY_VOXEL || tileIds.has(voxel));
}

function arraysMatchTheBox(piece: Piece): boolean {
  const cells = piece.width * piece.depth * piece.layers;
  return piece.voxels.length === cells && piece.facings.length === cells;
}

function isAQuarterTurn(facing: number): boolean {
  return Number.isInteger(facing) && facing >= 0 && facing < VOXEL_FACING_COUNT;
}

function sameJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}
