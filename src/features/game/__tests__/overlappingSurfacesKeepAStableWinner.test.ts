import * as THREE from 'three';
import type { ItemId } from '@/features/asset-library/asset';
import type { CreatureDef } from '@/features/asset-library/creatures/creatureDef';
import { newItemWithId } from '@/features/asset-library/items/itemDef';
import {
  COPLANAR_LANES,
  coplanarLane,
  coplanarPullOf,
  pullTowardCamera,
} from '../render/view3d/coplanarPull';
import { creatureBodyMaterials } from '../render/view3d/creatureSurfaces';
import { itemMaterials } from '../render/view3d/itemMeshBuild';
import { overviewNeighborDrop } from '../render/view3d/terrainOverview';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';

export function checkOverlappingSurfacesKeepAStableWinner(check: CheckReporter): void {
  checkLayersPullInAFixedFrontToBackOrder(check);
  checkLanesSpreadSurfacesWithinALayer(check);
  checkPullingWritesThePolygonOffset(check);
  checkItemsAndCreaturesCarryTheirPulls(check);
  checkTheOverviewStaggersItsOverlappingCells(check);
}

function checkLayersPullInAFixedFrontToBackOrder(check: CheckReporter): void {
  const lastLane = COPLANAR_LANES - 1;
  check(
    'the terrain bulk keeps an untouched depth, so every pull is measured against it',
    coplanarPullOf('terrain') === 0,
  );
  check(
    'a character always wins depth against an item, whatever lanes they took',
    coplanarPullOf('character', 0) < coplanarPullOf('item', lastLane),
  );
  check(
    'an item always wins depth against a marker or fixture',
    coplanarPullOf('item', 0) < coplanarPullOf('marker', lastLane),
  );
  check(
    'a marker or fixture always wins depth against the ground it stands on',
    coplanarPullOf('marker', 0) < coplanarPullOf('terrain'),
  );
  check(
    'the terrain overview always loses depth against the detailed ground',
    coplanarPullOf('terrainOverview', lastLane) > coplanarPullOf('terrain'),
  );
}

function checkLanesSpreadSurfacesWithinALayer(check: CheckReporter): void {
  const catalogOfNeighbouringIds = Array.from({ length: COPLANAR_LANES }, (_, index) => index + 1);
  check(
    'every id in a small catalog takes its own lane, so two items on one tile cannot tie',
    new Set(catalogOfNeighbouringIds.map(coplanarLane)).size === COPLANAR_LANES,
  );
  check('a hashed lane stays inside its layer band', coplanarLane('gaunt one:walk@16777215') < COPLANAR_LANES);
  check('a negative id still lands on a lane', coplanarLane(-3) >= 0 && coplanarLane(-3) < COPLANAR_LANES);
}

function checkPullingWritesThePolygonOffset(check: CheckReporter): void {
  const materials = [new THREE.MeshLambertMaterial(), new THREE.MeshLambertMaterial()];
  pullTowardCamera(materials, coplanarPullOf('item', 5));
  check(
    'a pull reaches every material of a multi-face surface',
    materials.every((material) => material.polygonOffset && material.polygonOffsetUnits === coplanarPullOf('item', 5)),
  );
  check(
    'the slope-scaled factor follows the pull, so tilted overlaps stay ordered too',
    materials.every((material) => material.polygonOffsetFactor === coplanarPullOf('item', 5) / COPLANAR_LANES),
  );
  pullTowardCamera(materials, coplanarPullOf('terrain'));
  check(
    'the terrain pull of zero turns the offset off instead of leaving a stale one',
    materials.every((material) => !material.polygonOffset && material.polygonOffsetUnits === 0),
  );
}

function checkItemsAndCreaturesCarryTheirPulls(check: CheckReporter): void {
  const spearUnits = offsetUnitsOf(itemMaterials(newItemWithId(1 as ItemId)));
  const shieldUnits = offsetUnitsOf(itemMaterials(newItemWithId(2 as ItemId)));
  const creatureUnits = offsetUnitsOf(
    creatureBodyMaterials({ id: 3, color: '#a05252', faceArt: null } as unknown as CreatureDef),
  );
  check(
    'two items dropped on the same tile pull to different depths',
    spearUnits.size === 1 && shieldUnits.size === 1 && !unitsMatch(spearUnits, shieldUnits),
  );
  check(
    'every item pulls inside the item band',
    [...spearUnits, ...shieldUnits].every(
      (units) => units <= coplanarPullOf('item', 0) && units >= coplanarPullOf('item', COPLANAR_LANES - 1),
    ),
  );
  check(
    'a creature body pulls in front of every item',
    [...creatureUnits].every((units) => units <= coplanarPullOf('character', 0)),
  );
}

function checkTheOverviewStaggersItsOverlappingCells(check: CheckReporter): void {
  const touchingCells: [number, number][] = [[0, 0], [1, 0], [0, 1], [1, 1]];
  const drops = touchingCells.map(([x, y]) => overviewNeighborDrop(64, x, y));
  check(
    'every overview cell sits at a different depth from all eight touching neighbours',
    new Set(drops).size === touchingCells.length,
  );
  check(
    'the stagger only sinks cells, so the overview stays below the detailed ground',
    drops.every((drop) => drop >= 0),
  );
  check(
    'the stagger grows with the cell span, so it still resolves from far away',
    overviewNeighborDrop(128, 1, 1) === 2 * overviewNeighborDrop(64, 1, 1),
  );
  check(
    'the stagger stays a sliver of a cell, so it never reads as a terrain step',
    drops.every((drop) => drop < 64 * 0.01),
  );
}

function offsetUnitsOf(materials: THREE.Material | THREE.Material[]): Set<number> {
  const surfaceMaterials = Array.isArray(materials) ? materials : [materials];
  return new Set(surfaceMaterials.map((material) => material.polygonOffsetUnits));
}

function unitsMatch(some: Set<number>, other: Set<number>): boolean {
  return [...some].some((units) => other.has(units));
}
