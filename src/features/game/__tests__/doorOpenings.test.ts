import * as THREE from 'three';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { DOOR_STANDS_TALL } from '../fixtures/looks/door';
import { DOOR_OPENING_SECONDS, DoorOpenings } from '../render/view3d/animations/doorOpenings';

export function checkDoorOpenings(check: CheckReporter): void {
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
