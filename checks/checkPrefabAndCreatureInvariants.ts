import { CreatureAssets } from '../assets/creatures/creatureAssets';
import { CreatureSim } from '../world/creatureSim/creatureSim';
import { WANDER } from '../assets/creatures/behaviorKinds';
import { PipelineEvaluator } from '../procgen/eval/evaluator';
import { PipelineStore } from '../procgen/pipeline/pipelineStore';
import { sanitizePipeline } from '../procgen/pipeline/sanitizePipeline';
import type { PipelineState } from '../procgen/pipeline/pipelineState';
import { displayModesForKind } from '../procgen/display/displayBinding';
import { asPoints } from '../procgen/values/valueAccess';
import { EMPTY_TILE } from '../procgen/values/chunkValues';
import { WorldSampler } from '../procgen/worldSampler';
import { prefabFromWorldRegion } from '../assets/prefabs/captureRegionAsPrefab';
import { EMPTY_VOXEL, voxelAt, type Prefab } from '../assets/prefabs/prefabDef';
import { tileIdOfVoxel } from '../procgen/prefabOverlay/packedVoxel';
import { PrefabAssets } from '../assets/prefabs/prefabAssets';
import { resizedPrefab } from '../assets/prefabs/prefabResize';
import { rotatedDepth, rotatedPrefab, rotatedWidth } from '../assets/prefabs/prefabRotation';
import { asciiSnapshot } from '../world/render/ascii/asciiSnapshot';
import { voxelPlacementsForRect } from '../world/render/view3d/voxelPlacements';
import { TileAssets } from '../assets/tiles/tileAssets';
import { isWalkableTile } from '../world/tileWalkability';

export interface CheckReporter {
  (name: string, condition: boolean): void;
}

export function checkPrefabAndCreatureInvariants(check: CheckReporter): void {
  const tileAssets = new TileAssets();
  const prefabs = new PrefabAssets((name) => tileIdByName(tileAssets, name));
  const cottage = prefabs.all()[0]!;

  checkPrefabGeometry(check, cottage);
  checkPrefabStamping(check, tileAssets, prefabs, cottage);
  checkCaptureRoundTrip(check, tileAssets, prefabs, cottage);
  checkCreatureSim(check, tileAssets, prefabs);
  checkEmberMarchesAssets(check, tileAssets);
  check(
    'points nodes can be displayed as markers, prefabs or creatures',
    ['markers', 'prefabs', 'creatures'].every((mode) =>
      displayModesForKind('points').includes(mode as never),
    ),
  );
}

function checkPrefabGeometry(check: CheckReporter, prefab: Prefab): void {
  const fullTurn = rotatedPrefab(rotatedPrefab(rotatedPrefab(rotatedPrefab(prefab, 1), 1), 1), 1);
  check(
    'four quarter turns return a prefab to its original voxels',
    JSON.stringify(fullTurn.voxels) === JSON.stringify(prefab.voxels),
  );
  check(
    'a quarter turn swaps width and depth',
    rotatedWidth(prefab, 1) === prefab.depth && rotatedDepth(prefab, 1) === prefab.width,
  );
  const grown = resizedPrefab(prefab, {
    width: prefab.width + 2,
    depth: prefab.depth + 2,
    layers: prefab.layers + 1,
  });
  check(
    'growing a prefab keeps every voxel it already had',
    everyCell(prefab, (x, y, layer) => voxelAt(grown, x, y, layer) === voxelAt(prefab, x, y, layer)),
  );
  const shrunk = resizedPrefab(prefab, { width: 1, depth: 1, layers: 1 });
  check(
    'shrinking a prefab keeps the corner voxel and drops the rest',
    shrunk.voxels.length === 1 && shrunk.voxels[0] === voxelAt(prefab, 0, 0, 0),
  );
}

function checkPrefabStamping(
  check: CheckReporter,
  tileAssets: TileAssets,
  prefabs: PrefabAssets,
  prefab: Prefab,
): void {
  const world = stampedWorld(tileAssets, prefabs, prefab.id);
  const point = firstPoint(world.evaluator);
  check('the prefab test world scatters at least one stamp point', point !== null);
  if (!point) return;
  const originX = point.x - prefab.anchorX;
  const originY = point.y - prefab.anchorY;
  check(
    'every ground voxel of a stamped prefab replaces the terrain tile beneath it',
    everyFootprintCell(prefab, (x, y) => {
      const ground = voxelAt(prefab, x, y, 0);
      return ground === EMPTY_VOXEL || world.sampler.tileAt(originX + x, originY + y) === ground;
    }),
  );
  check(
    'stamped prefab columns stand as tall as the prefab that made them',
    everyFootprintCell(prefab, (x, y) => {
      const column = world.sampler.packedVoxelColumnAt(originX + x, originY + y) ?? [];
      return column.length <= prefab.layers && columnMatchesPrefab(column, prefab, x, y);
    }),
  );
  const placements = voxelPlacementsForRect(
    world.sampler,
    tileAssets,
    originX,
    originY,
    prefab.width,
    prefab.depth,
  );
  check(
    'stacked prefab voxels become 2.5D blocks above the ground',
    placements.voxels.length > 0 &&
      placements.voxels.every((placement) => placement.elevation >= 0),
  );
  check(
    'the ascii view shows the topmost voxel of a stamped prefab',
    asciiSnapshot(world.sampler, tileAssets, point.x, point.y, 3, 3).includes(
      tileAssets.byId(topVoxelOfPrefab(prefab))?.symbol ?? '\u0000',
    ),
  );
  check(
    'a stamped wall blocks movement wherever it lands',
    everyFootprintCell(prefab, (x, y) => {
      const ground = voxelAt(prefab, x, y, 0);
      if (ground === EMPTY_VOXEL) return true;
      const walkable = tileAssets.byId(ground)?.walkable ?? true;
      return isWalkableTile(tileAssets, world.sampler.tileAt(originX + x, originY + y)) === walkable;
    }),
  );
}

function checkCaptureRoundTrip(
  check: CheckReporter,
  tileAssets: TileAssets,
  prefabs: PrefabAssets,
  prefab: Prefab,
): void {
  const world = stampedWorld(tileAssets, prefabs, prefab.id);
  const point = firstPoint(world.evaluator);
  if (!point) return;
  const originX = point.x - prefab.anchorX;
  const originY = point.y - prefab.anchorY;
  const captured = prefabFromWorldRegion(
    world.sampler,
    {
      minX: originX,
      minY: originY,
      maxX: originX + prefab.width - 1,
      maxY: originY + prefab.depth - 1,
    },
    'captured',
  );
  check(
    'capturing a stamped prefab out of the world keeps its footprint',
    captured.width === prefab.width && captured.depth === prefab.depth,
  );
  check(
    'capturing a stamped prefab keeps every voxel above the ground layer',
    everyCell(prefab, (x, y, layer) => {
      const original = voxelAt(prefab, x, y, layer);
      return (
        layer === 0 ||
        original === EMPTY_VOXEL ||
        voxelAt(captured as Prefab, x, y, layer) === original
      );
    }),
  );
}

function checkEmberMarchesAssets(check: CheckReporter, tileAssets: TileAssets): void {
  const walkableByName = (name: string) =>
    tileAssets.all().find((tile) => tile.name === name)?.walkable;
  check(
    'the ember tiles ship with the tile assets: walkable ash, blocking hedge, scorched stone and charred tree',
    walkableByName('ash') === true &&
      walkableByName('scorched stone') === false &&
      walkableByName('hedge') === false &&
      walkableByName('charred tree') === false,
  );
  const creatures = new CreatureAssets();
  const byName = (name: string) => creatures.all().find((creature) => creature.name === name);
  check(
    'the ember marches creatures ship with the creature assets, and only the wisp phases',
    byName('ash hound')?.phasing === 0 &&
      byName('fen heron')?.phasing === 0 &&
      byName('ember wisp')?.phasing === 1,
  );
}

function checkCreatureSim(check: CheckReporter, tileAssets: TileAssets, prefabs: PrefabAssets): void {
  const creatures = new CreatureAssets();
  const wanderer = creatures.all().find((creature) => creature.behavior === WANDER)!;
  const first = steppedSim(tileAssets, prefabs, creatures, wanderer.id);
  const second = steppedSim(tileAssets, prefabs, creatures, wanderer.id);
  check('creature spawns appear around the player', first.sim.active().length > 0);
  check(
    'the same world and seed step creatures to the same places',
    positionsOf(first.sim) === positionsOf(second.sim),
  );
  check(
    'creatures stay within their roam radius of the spawn cell',
    first.sim
      .active()
      .every(
        (creature) =>
          Math.hypot(creature.x - creature.homeX, creature.y - creature.homeY) <=
          wanderer.roam + 1,
      ),
  );
  check(
    'creatures never stand on a cell the player could not walk on',
    first.sim
      .active()
      .every((creature) =>
        isWalkableTile(
          tileAssets,
          first.sampler.tileAt(Math.round(creature.x), Math.round(creature.y)),
        ),
      ),
  );
}

function stampedWorld(tileAssets: TileAssets, prefabs: PrefabAssets, prefabId: number) {
  return worldFrom(tileAssets, prefabs, pointsPipeline({ mode: 'prefabs', prefabId, rotation: 0 }));
}

function steppedSim(
  tileAssets: TileAssets,
  prefabs: PrefabAssets,
  creatures: CreatureAssets,
  creatureId: number,
) {
  const world = worldFrom(tileAssets, prefabs, pointsPipeline({ mode: 'creatures', creatureId }));
  const isWalkableAt = (x: number, y: number) => isWalkableTile(tileAssets, world.sampler.tileAt(x, y));
  const sim = new CreatureSim({
    sampler: world.sampler,
    creatureAssets: creatures,
    world: { playerX: 0, playerY: 0 },
    isWalkableAt,
  });
  for (let tick = 0; tick < 400; tick++) sim.step(0.05);
  return { sim, sampler: world.sampler };
}

function worldFrom(tileAssets: TileAssets, prefabs: PrefabAssets, state: PipelineState) {
  const store = new PipelineStore(state);
  const evaluator = new PipelineEvaluator(store);
  return { store, evaluator, sampler: new WorldSampler(store, evaluator, tileAssets, prefabs) };
}

function pointsPipeline(display: unknown): PipelineState {
  return sanitizePipeline({
    seed: 99,
    nodes: [
      {
        id: 'ground',
        type: 'constantField',
        params: { value: 1 },
        inputs: {},
        display: { mode: 'hidden' },
      },
      {
        id: 'terrain',
        type: 'thresholdTiles',
        params: { threshold: 0.5, aboveTile: 2, belowTile: 0 },
        inputs: { field: 'ground' },
        display: { mode: 'tileLayer' },
      },
      {
        id: 'sites',
        type: 'scatterPoints',
        params: { density: 0.01, maskAtLeast: 0, maskAtMost: 1 },
        inputs: {},
        display,
      },
    ],
  });
}

function firstPoint(evaluator: PipelineEvaluator): { x: number; y: number } | null {
  for (let chunkY = 0; chunkY < 4; chunkY++) {
    for (let chunkX = 0; chunkX < 4; chunkX++) {
      const points = asPoints(evaluator.valueFor('sites', chunkX, chunkY)) ?? [];
      if (points.length > 0) return points[0]!;
    }
  }
  return null;
}

function topVoxelOfPrefab(prefab: Prefab): number {
  return voxelAt(prefab, prefab.anchorX, prefab.anchorY, prefab.layers - 1);
}

function columnMatchesPrefab(column: number[], prefab: Prefab, x: number, y: number): boolean {
  return column.every((packed, layer) => {
    const tileId = tileIdOfVoxel(packed);
    return tileId === EMPTY_TILE || tileId === voxelAt(prefab, x, y, layer);
  });
}

function everyCell(
  prefab: Prefab,
  holds: (x: number, y: number, layer: number) => boolean,
): boolean {
  for (let layer = 0; layer < prefab.layers; layer++) {
    for (let y = 0; y < prefab.depth; y++) {
      for (let x = 0; x < prefab.width; x++) if (!holds(x, y, layer)) return false;
    }
  }
  return true;
}

function everyFootprintCell(prefab: Prefab, holds: (x: number, y: number) => boolean): boolean {
  for (let y = 0; y < prefab.depth; y++) {
    for (let x = 0; x < prefab.width; x++) if (!holds(x, y)) return false;
  }
  return true;
}

function positionsOf(sim: CreatureSim): string {
  return JSON.stringify(
    sim
      .active()
      .map((creature) => `${creature.key}:${creature.x.toFixed(4)},${creature.y.toFixed(4)}`)
      .sort(),
  );
}

function tileIdByName(tileAssets: TileAssets, name: string): number {
  return tileAssets.all().find((tile) => tile.name === name)?.id ?? -1;
}
