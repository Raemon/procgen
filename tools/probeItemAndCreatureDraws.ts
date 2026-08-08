import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import '../procgen/nodes';
import { seedPersistedFile } from '../frontend/persistence/repoFileStore';
import { PipelineEvaluator } from '../procgen/eval/evaluator';
import { PipelineStore } from '../procgen/pipeline/pipelineStore';
import { loadStoredPipeline } from '../procgen/pipeline/pipelineStorage';
import type { NodeInstance } from '../procgen/pipeline/pipelineState';
import { WorldSampler } from '../procgen/worldSampler';
import { TileAssets } from '../assets/tiles/tileAssets';
import { CreatureAssets } from '../assets/creatures/creatureAssets';
import { ItemAssets } from '../assets/items/itemAssets';
import { CreatureSim } from '../world/creatureSim/creatureSim';
import { CharacterSpriteAssets } from '../world/render/view3d/characterSpriteAssets';
import { CreatureMeshes } from '../world/render/view3d/creatureMeshes';
import { ItemMeshes } from '../world/render/view3d/itemMeshes';
import { stubTheCanvasTexturesAreRasterizedOnto } from '../checks/stubCanvasRasterization';

const SCATTERED_ITEM_IDS = [0, 1, 2, 3, 4, 5];
const SCATTERED_CREATURE_IDS = [0, 1, 2, 3, 4, 5, 6, 7];
const SCATTER_DENSITY = 0.02;
const VIEW_RADIUS_TILES = 48;
const CAMERA_VIEW = { yaw: 0, seconds: 0 };

stubTheCanvasTexturesAreRasterizedOnto();

const world = worldOfScatteredItemsAndCreatures();
const scene = new THREE.Group();
const sprites = new CharacterSpriteAssets();

const items = new ItemMeshes(scene, world.itemAssets, world.sampler);
items.syncAround(0, 0, VIEW_RADIUS_TILES);

const creatures = new CreatureMeshes(scene, world.creatureAssets, world.sampler, sprites);
const sim = simSpawnedAroundOrigin(world);
creatures.syncTo(sim, CAMERA_VIEW);

console.log(`== a ${VIEW_RADIUS_TILES * 2 + 1} tile square of scattered ground items and creatures ==`);
console.log(`  ${world.sampler.itemSpawnsIn(-VIEW_RADIUS_TILES, -VIEW_RADIUS_TILES, VIEW_RADIUS_TILES, VIEW_RADIUS_TILES).length} ground items across ${SCATTERED_ITEM_IDS.length} item definitions`);
console.log(`  ${sim.active().length} creatures across ${SCATTERED_CREATURE_IDS.length} creature definitions`);
console.log(report(scene));

function report(group: THREE.Object3D): string {
  const drawables = drawablesOf(group);
  const instanced = drawables.filter((mesh) => mesh instanceof THREE.InstancedMesh);
  return [
    `  ${drawables.length} meshes, ${instanced.length} of them instanced`,
    `  ${instancedCopies(instanced)} copies carried by those instanced meshes`,
    `  ${geometriesOf(drawables).size} geometries, ${materialsOf(drawables).size} materials, ${texturesOf(drawables).size} textures`,
    `  ${drawCalls(drawables)} draw calls`,
  ].join('\n');
}

function drawablesOf(group: THREE.Object3D): THREE.Mesh[] {
  const meshes: THREE.Mesh[] = [];
  group.traverse((object) => {
    if (object instanceof THREE.Mesh) meshes.push(object);
  });
  return meshes;
}

function instancedCopies(instanced: THREE.Mesh[]): number {
  return instanced.reduce((total, mesh) => total + (mesh as THREE.InstancedMesh).count, 0);
}

function geometriesOf(meshes: readonly THREE.Mesh[]): Set<THREE.BufferGeometry> {
  return new Set(meshes.map((mesh) => mesh.geometry));
}

function materialsOf(meshes: readonly THREE.Mesh[]): Set<THREE.Material> {
  return new Set(meshes.flatMap((mesh) => [mesh.material].flat()));
}

function texturesOf(meshes: readonly THREE.Mesh[]): Set<THREE.Texture> {
  const textures = new Set<THREE.Texture>();
  for (const material of materialsOf(meshes)) {
    const lambert = material as THREE.MeshLambertMaterial;
    if (lambert.map) textures.add(lambert.map);
    if (lambert.normalMap) textures.add(lambert.normalMap);
  }
  return textures;
}

function drawCalls(meshes: readonly THREE.Mesh[]): number {
  return meshes.reduce((total, mesh) => total + drawCallsOfMesh(mesh), 0);
}

function drawCallsOfMesh(mesh: THREE.Mesh): number {
  if (!Array.isArray(mesh.material)) return 1;
  return Math.max(1, mesh.geometry.groups.length);
}

function simSpawnedAroundOrigin(world: ReturnType<typeof worldOfScatteredItemsAndCreatures>) {
  const sim = new CreatureSim({
    sampler: world.sampler,
    creatureAssets: world.creatureAssets,
    world: { playerX: 0, playerY: 0 },
    isWalkableAt: () => true,
  });
  sim.step(0);
  return sim;
}

function worldOfScatteredItemsAndCreatures() {
  seedPersistedFile('tiles', JSON.parse(readFileSync('data/tiles.json', 'utf8')));
  seedPersistedFile('pipeline', JSON.parse(readFileSync('data/pipeline.json', 'utf8')));
  const tileAssets = new TileAssets();
  const itemAssets = new ItemAssets();
  const creatureAssets = new CreatureAssets();
  const state = loadStoredPipeline();
  state.nodes.push(...scatterNodes());
  const store = new PipelineStore(state);
  const sampler = new WorldSampler(
    store,
    new PipelineEvaluator(store),
    tileAssets,
    undefined,
    itemAssets,
  );
  return { tileAssets, itemAssets, creatureAssets, sampler };
}

function scatterNodes(): NodeInstance[] {
  return [
    ...SCATTERED_ITEM_IDS.map((itemId) =>
      scatterNode(`probeItem${itemId}`, { mode: 'items', itemId }),
    ),
    ...SCATTERED_CREATURE_IDS.map((creatureId) =>
      scatterNode(`probeCreature${creatureId}`, { mode: 'creatures', creatureId }),
    ),
  ];
}

function scatterNode(id: string, display: NodeInstance['display']): NodeInstance {
  return {
    id,
    type: 'scatterPoints',
    label: id,
    comment: '',
    folder: 'probe',
    enabled: true,
    params: { density: SCATTER_DENSITY, maskAtLeast: 0, maskAtMost: 1 },
    inputs: {},
    display,
  };
}
