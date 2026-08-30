import * as THREE from 'three';
import '@/features/asset-library/worlds/nodes';
import { worldTheAppOpensWith } from './headlessWorld';
import { stubTheCanvasTexturesAreRasterizedOnto } from './stubCanvasForHeadlessTextures';
import { applyTileSideBudget } from '@/features/game/render/view3d/chunkDetail';
import { disposeMeshChildren } from '@/features/game/render/view3d/disposeMeshResources';
import { tileSideBudget } from '@/features/game/render/view3d/tileDetailBudget';
import { buildChunkMeshGroup } from '@/features/game/render/view3d/worldMeshes';

const VIEWPORT_HEIGHT_PIXELS = 900;
const VERTICAL_FOV_DEGREES = 50;
const CAMERA_DISTANCES = [1.2, 8, 32, 128, 512, 800];

stubTheCanvasTexturesAreRasterizedOnto();

const world = worldTheAppOpensWith();
const chunk = buildChunkMeshGroup(world.sampler, world.tileAssets, 0, 0);

console.log('== what one chunk of the ember marches draws at each camera distance ==');
for (const distance of CAMERA_DISTANCES) {
  const budget = tileSideBudget(VERTICAL_FOV_DEGREES, VIEWPORT_HEIGHT_PIXELS, distance);
  applyTileSideBudget(chunk, budget);
  console.log(`  ${String(distance).padStart(5)} tiles away, ${String(budget).padStart(4)} texels per tile: ${drawnSurfaces(chunk)}`);
}

console.log('\n== how much a second chunk has to build ==');
applyTileSideBudget(chunk, 1024);
const firstMaterials = materialsOf(chunk);
disposeMeshChildren(groupHolding(chunk));
const second = buildChunkMeshGroup(world.sampler, world.tileAssets, 1, 0);
const shared = [...materialsOf(second)].filter((material) => firstMaterials.has(material)).length;
console.log(`  ${shared} of its ${materialsOf(second).size} materials were already built by the first chunk`);

function drawnSurfaces(group: THREE.Object3D): string {
  const sides = new Set<number>();
  let normalMapped = 0;
  for (const material of materialsOf(group)) {
    const lambert = material as THREE.MeshLambertMaterial;
    if (lambert.map) sides.add((lambert.map.image as { width: number }).width);
    if (lambert.normalMap) normalMapped++;
  }
  return `art at ${[...sides].sort((a, b) => b - a).join('/')} px, ${normalMapped} faces with relief`;
}

function materialsOf(group: THREE.Object3D): Set<THREE.Material> {
  const materials = new Set<THREE.Material>();
  group.traverse((object) => {
    if (object instanceof THREE.Mesh)
      for (const material of [object.material].flat()) materials.add(material);
  });
  return materials;
}

function groupHolding(child: THREE.Object3D): THREE.Group {
  const holder = new THREE.Group();
  holder.add(child);
  return holder;
}
