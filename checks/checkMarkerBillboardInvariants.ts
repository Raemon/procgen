import type * as THREE from 'three';
import { billboardHeightOfTile, billboardKindOfTile } from '../assets/tiles/art/billboards/billboardKind';
import { markerBillboardArt } from '../assets/tiles/art/billboards/markerBillboardArt';
import { TILE_ART_SIZE } from '../assets/tiles/art/artSize';
import { defaultTiles } from '../assets/tiles/defaultTiles';
import { SIDE_FACES, type FacePixels } from '../assets/tiles/tileFaceArt';
import type { TileDef } from '../assets/tiles/tileDef';
import { TileAssets } from '../assets/tiles/tileAssets';
import { markerAppearance } from '../procgen/display/markerAppearance';
import type { Marker, WorldSampler } from '../procgen/worldSampler';
import { EVERY_FACE } from '../world/render/view3d/culling/visibleFaceMask';
import { markerPlacementsForRect } from '../world/render/view3d/markerPlacements';
import { billboardShape, standingFixtureShape } from '../world/render/view3d/tileShapes';
import type { CheckReporter } from './checkReporter';

const SIDE_MATERIALS = [0, 1, 4, 5];

export function checkMarkerBillboardInvariants(check: CheckReporter): void {
  checkScatteredPropsDrawCrossedQuadsRatherThanACube(check);
  checkBillboardsKeepTheirSpriteUndistorted(check);
  checkEveryPropTilePaintsAStandingSilhouette(check);
  checkPropArtIsSharedSoItsTexturesAreBuiltOnce(check);
  checkMarkersWithoutATileStayPins(check);
  checkMarkersReachTheShapeTheirLookAsksFor(check);
}

function checkScatteredPropsDrawCrossedQuadsRatherThanACube(check: CheckReporter): void {
  const geometry = billboardShape().geometry(EVERY_FACE);
  check(
    'a billboard prop draws two quads, not the six faces of a cube',
    geometry.groups.length === 2,
  );
  check(
    'both billboard quads take side-face materials, so face art lands on them',
    geometry.groups.every((group) => SIDE_MATERIALS.includes(group.materialIndex ?? -1)),
  );
  check(
    'the two billboard quads cross instead of sitting in the same plane',
    quadSpansAxis(geometry, 0) && quadSpansAxis(geometry, 2),
  );
  check(
    'a billboard quad is a unit square, so a placement height scales it exactly',
    extentAlong(geometry, 1) === 1,
  );
}

function checkBillboardsKeepTheirSpriteUndistorted(check: CheckReporter): void {
  const scaled = billboardShape().scaleOf?.(placementStandingAt(2.6));
  check(
    'a billboard scales by the same amount on every axis, so tall props are not stretched thin',
    scaled !== undefined && scaled[0] === scaled[1] && scaled[1] === scaled[2],
  );
  check('a billboard scales to the height its marker carries', scaled?.[1] === 2.6);
  check(
    'a standing fixture still stretches only upwards',
    standingFixtureShape().scaleOf?.(placementStandingAt(2.6))?.[0] === 1,
  );
}

function checkEveryPropTilePaintsAStandingSilhouette(check: CheckReporter): void {
  const arts = propTiles().map((tile) => ({ tile, art: markerBillboardArt(tile) }));
  check('every prop tile paints billboard art at the tile art size', arts.every((one) => one.art.size === TILE_ART_SIZE));
  check(
    'every prop billboard paints the same silhouette on all four sides',
    arts.every((one) => SIDE_FACES.every((face) => paintedCount(one.art[face]) > 0)),
  );
  check(
    'a billboard silhouette leaves transparent margin, so it reads as a sprite and not a filled cube',
    arts.every((one) => paintedCount(one.art.north) < TILE_ART_SIZE * TILE_ART_SIZE * 0.8),
  );
  check(
    'every billboard prop touches the bottom row, so it stands on the ground instead of floating',
    arts.every((one) => paintedInRow(one.art.north, TILE_ART_SIZE - 1) > 0),
  );
  check(
    'billboard art is left off the top and bottom faces, which no quad draws',
    arts.every((one) => paintedCount(one.art.top) === 0 && paintedCount(one.art.bottom) === 0),
  );
  check(
    'a tree billboard stands taller than a ground bloom',
    billboardHeightOfTile(tileNamed('oak tree')) > billboardHeightOfTile(tileNamed('meadow flowers')),
  );
  check(
    'the tile catalogue still sorts its props into every billboard silhouette',
    new Set(propTiles().map(billboardKindOfTile)).size === 5,
  );
}

function checkPropArtIsSharedSoItsTexturesAreBuiltOnce(check: CheckReporter): void {
  const tile = tileNamed('oak tree');
  check(
    'asking twice for a tile billboard hands back the same art, so its textures are cached',
    markerBillboardArt(tile) === markerBillboardArt(tile),
  );
  check(
    'recolouring a tile repaints its billboard instead of serving the stale art',
    markerBillboardArt(tile) !== markerBillboardArt({ ...tile, color: '#b02a2a' }),
  );
}

function checkMarkersWithoutATileStayPins(check: CheckReporter): void {
  const look = markerAppearance(new TileAssets(), { mode: 'markers', tileId: -1, glyph: '⌂', color: '#e0b06a' });
  check('a marker with no tile behind it grows no billboard', look.faceArt === null);
  check('a marker with no tile behind it keeps its own glyph', look.glyph === '⌂');
}

function checkMarkersReachTheShapeTheirLookAsksFor(check: CheckReporter): void {
  const placements = markerPlacementsForRect(groundlessSampler(), 0, 0, 4, 4, {
    markersIn: () => [propMarker(), fixtureMarker(), pinMarker()],
  });
  check('a prop marker is drawn as a billboard', placements.billboards.length === 1);
  check('a fixture marker is still drawn as a standing box', placements.standingFixtures.length === 1);
  check('a marker with neither look is still drawn as a pin', placements.pins.length === 1);
  check(
    'a billboard marker draws with unpainted pixels punched out',
    placements.billboards[0]?.baseColor.endsWith('00') === true,
  );
  check('a billboard marker carries the height its tile asked for', placements.billboards[0]?.height === 2.6);
}

function propTiles(): TileDef[] {
  return ['oak tree', 'pine tree', 'hazel bush', 'granite outcrop', 'meadow flowers'].map(tileNamed);
}

function tileNamed(name: string): TileDef {
  const tile = defaultTiles().find((one) => one.name === name);
  if (!tile) throw new Error(`no default tile named ${name}`);
  return tile;
}

function propMarker(): Marker {
  const tile = tileNamed('oak tree');
  return { x: 1, y: 1, tag: 'oak', ...markerAppearance(new TileAssets(defaultTiles()), markerBindingFor(tile)) };
}

function markerBindingFor(tile: TileDef): { mode: 'markers'; tileId: number; glyph: string; color: string } {
  return { mode: 'markers', tileId: tile.id, glyph: tile.symbol, color: tile.color };
}

function fixtureMarker(): Marker {
  return { x: 2, y: 1, tag: 'lever', glyph: '⌐', color: '#9aa7b4', faceArt: null, standingHeight: 0.5 };
}

function pinMarker(): Marker {
  return { x: 3, y: 1, tag: 'landmark', glyph: '⌂', color: '#e0b06a', faceArt: null };
}

function placementStandingAt(height: number) {
  return { ...pinPlacement(), height };
}

function pinPlacement() {
  return {
    x: 0,
    y: 0,
    elevation: 0,
    height: 1,
    baseColor: '#ffffff',
    shade: 1,
    faceArt: null,
    textureId: null,
    glow: 0,
    sunkenAsWater: false,
    shape: 'cube' as const,
    facing: 0,
  };
}

function groundlessSampler(): WorldSampler {
  return { markersIn: () => [], elevationAt: () => 0 } as unknown as WorldSampler;
}

function paintedCount(pixels: FacePixels | undefined): number {
  return (pixels ?? []).filter((ink) => ink !== null).length;
}

function paintedInRow(pixels: FacePixels | undefined, row: number): number {
  return paintedCount((pixels ?? []).slice(row * TILE_ART_SIZE, (row + 1) * TILE_ART_SIZE));
}

function quadSpansAxis(geometry: THREE.BufferGeometry, axis: number): boolean {
  return extentAlong(geometry, axis) > 0;
}

function extentAlong(geometry: THREE.BufferGeometry, axis: number): number {
  const position = geometry.getAttribute('position');
  const values = Array.from({ length: position.count }, (_, index) => position.getComponent(index, axis));
  return Math.max(...values) - Math.min(...values);
}
