import * as THREE from 'three';
import type { Marker } from '@/features/asset-library/worlds/worldSampler';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { fixtureLook } from '../fixtures/fixtureAppearance';
import { DOOR_STANDS_TALL } from '../fixtures/looks/door';
import { CoveredCells } from '../render/view3d/animations/coveredCells';
import { DOOR_OPENING_SECONDS, DoorOpenings } from '../render/view3d/animations/doorOpenings';
import type { Cell } from '../worldRules';

export function checkDoorOpenings(check: CheckReporter): void {
  checkALeafLiftsIntoItsLintel(check);
  checkACoveredCellHidesItsMarker(check);
}

function checkACoveredCellHidesItsMarker(check: CheckReporter): void {
  const remeshed: Cell[] = [];
  const covered = new CoveredCells((cell) => remeshed.push(cell));
  const crate = { x: 4, y: 7, ...fixtureLook('crate', false) };
  const plate = { x: 5, y: 7, ...fixtureLook('plate', false) };
  const world = { markersIn: (): Marker[] => [crate, plate] };
  const shown = covered.markersExcept(world);
  check('an uncovered world hands back every marker it has', shown.markersIn(0, 0, 9, 9).length === 2);
  const uncover = covered.cover({ x: 4, y: 7 });
  check(
    'covering a cell hides the marker baked there and asks for that chunk again',
    shown.markersIn(0, 0, 9, 9).length === 1 && shown.markersIn(0, 0, 9, 9)[0] === plate && remeshed.length === 1,
  );
  const alsoUncover = covered.cover({ x: 4, y: 7 });
  uncover();
  check('a cell two animations cover stays hidden until the last of them lets go', covered.isCovered(4, 7));
  alsoUncover();
  alsoUncover();
  check(
    'once every cover is lifted the marker is back and the chunk was asked for once more',
    shown.markersIn(0, 0, 9, 9).length === 2 && !covered.isCovered(4, 7) && remeshed.length === 2,
  );
}

function checkALeafLiftsIntoItsLintel(check: CheckReporter): void {
  const root = new THREE.Group();
  const doors = new DoorOpenings(root, () => 3, () => new THREE.MeshLambertMaterial());
  doors.open([{ x: 4, y: 7 }]);
  const leaf = root.children[0] as THREE.Mesh;
  const topOf = () => leaf.position.y + leaf.scale.y / 2;
  check(
    'a door that opens is covered by a full-height closed leaf standing on its cell',
    root.children.length === 1 && leaf.position.x === 4.5 && leaf.position.z === 7.5 && leaf.scale.y === DOOR_STANDS_TALL && topOf() === 3 + DOOR_STANDS_TALL,
  );
  doors.advance(DOOR_OPENING_SECONDS / 2);
  check(
    'halfway through, the leaf has shrunk upward while its top stays in the lintel',
    leaf.scale.y < DOOR_STANDS_TALL && leaf.scale.y > 0 && Math.abs(topOf() - (3 + DOOR_STANDS_TALL)) < 1e-9,
  );
  doors.advance(DOOR_OPENING_SECONDS);
  check('once lifted, the leaf is gone from the scene', root.children.length === 0);
  doors.open([{ x: 0, y: 0 }, { x: 1, y: 0 }]);
  doors.dispose();
  check('disposing drops every leaf still lifting', root.children.length === 0);
}
