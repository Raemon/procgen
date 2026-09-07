import * as THREE from 'three';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { facingYawRadians, type FacingIndex } from '../facing';
import { LANTERN_LIGHT_RADIUS, lanternLightInk } from '../light/lanternLight';
import { PlayerCharacterMesh } from '../render/view3d/playerCharacterMesh';

export function checkLanternCharacter(check: CheckReporter): void {
  const stage = new THREE.Group();
  const character = new PlayerCharacterMesh();
  stage.add(character.object);

  const body = character.object.children[0] as THREE.Group;
  const meshes = body.children.filter((child) => child instanceof THREE.Mesh);
  check('the character is built from solid meshes, not a billboard quad', meshes.length >= 5);
  check(
    'every part carries its own geometry and material',
    meshes.every((mesh) => mesh.geometry !== undefined && mesh.material !== undefined),
  );

  faceEast(character);
  check('facing east turns the cube a quarter turn', closeTo(body.rotation.y, -Math.PI / 2));
  check('the cube keeps a fixed turn order so leaning cannot spin it', body.rotation.order === 'YXZ');

  faceNorth(character);
  check('facing north turns the cube back to zero', closeTo(body.rotation.y, 0));

  const still = body.position.y;
  standStill(character, 0.25);
  check('the lantern bobs while it idles', Math.abs(body.position.y - still) > 0.0001);

  walk(character);
  check('walking leans the cube into its heading', body.rotation.x < -0.05);

  const source = character.lightSource();
  check('the character declares a light source', source.radius === LANTERN_LIGHT_RADIUS);
  check('the light sits on the character tile', source.x === 4 && source.y === 2);
  check('the light floats at the glowing core', source.elevation > 1 && source.elevation < 2);
  check('the light is warm', source.ink === lanternLightInk(0xffcf7a));

  const tinted = new PlayerCharacterMesh(0xbfe4ff);
  tinted.standAt(stanceAt(0, 0, 0, 0, false), { yaw: 0, seconds: 0 });
  check('a tinted character lights the world in its own colour', tinted.lightSource().ink === lanternLightInk(0xbfe4ff));
  tinted.dispose();

  const released = new Set<string>();
  for (const mesh of meshes) {
    mesh.geometry.addEventListener('dispose', () => released.add(`geometry:${mesh.geometry.uuid}`));
    for (const material of materialsOf(mesh)) {
      material.addEventListener('dispose', () => released.add(`material:${material.uuid}`));
    }
  }
  character.dispose();
  check('disposing the character releases every geometry', countStartingWith(released, 'geometry:') === meshes.length);
  check(
    'disposing the character releases every material',
    countStartingWith(released, 'material:') === materialCount(meshes),
  );
  check('disposing the character takes it off the stage', character.object.parent === null);
  check('disposing the character empties its body', body.children.length === 0);
}

function faceEast(character: PlayerCharacterMesh): void {
  character.standAt(stanceAt(4.5, 2.5, 1, 2, false), { yaw: 0, seconds: 0 });
  character.standAt(stanceAt(4.5, 2.5, 1, 2, false), { yaw: 0, seconds: 1 });
}

function faceNorth(character: PlayerCharacterMesh): void {
  character.standAt(stanceAt(4.5, 2.5, 1, 0, false), { yaw: 0, seconds: 2 });
  character.standAt(stanceAt(4.5, 2.5, 1, 0, false), { yaw: 0, seconds: 3 });
}

function standStill(character: PlayerCharacterMesh, seconds: number): void {
  character.standAt(stanceAt(4.5, 2.5, 1, 0, false), { yaw: 0, seconds: 3 + seconds });
}

function walk(character: PlayerCharacterMesh): void {
  for (let step = 1; step <= 8; step++) {
    character.standAt(stanceAt(4.5, 2.5, 1, 0, true), { yaw: 0, seconds: 4 + step * 0.05 });
  }
}

function stanceAt(
  x: number,
  y: number,
  elevation: number,
  facing: FacingIndex,
  moving: boolean,
) {
  return { x, y, elevation, motion: { heading: facingYawRadians(facing), moving } };
}

function materialsOf(mesh: THREE.Mesh): THREE.Material[] {
  return Array.isArray(mesh.material) ? mesh.material : [mesh.material];
}

function materialCount(meshes: THREE.Object3D[]): number {
  return new Set(
    meshes.flatMap((mesh) => materialsOf(mesh as THREE.Mesh).map((material) => material.uuid)),
  ).size;
}

function countStartingWith(released: ReadonlySet<string>, prefix: string): number {
  return [...released].filter((entry) => entry.startsWith(prefix)).length;
}

function closeTo(value: number, wanted: number): boolean {
  return Math.abs(value - wanted) < 0.001;
}
