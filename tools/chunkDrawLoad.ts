import * as THREE from 'three';

export interface DrawLoad {
  meshes: number;
  instances: number;
  triangles: number;
  drawCalls: number;
}

export function drawLoadOf(group: THREE.Object3D): DrawLoad {
  const load: DrawLoad = { meshes: 0, instances: 0, triangles: 0, drawCalls: 0 };
  group.traverse((object) => {
    if (object instanceof THREE.Mesh) addMeshToLoad(load, object);
  });
  return load;
}

export function drawLoadLine(load: DrawLoad): string {
  return [
    `${load.meshes} meshes`,
    `${load.instances} instances`,
    `${load.triangles} triangles`,
    `${load.drawCalls} draw calls`,
  ].join(', ');
}

function addMeshToLoad(load: DrawLoad, mesh: THREE.Mesh): void {
  const instances = mesh instanceof THREE.InstancedMesh ? mesh.count : 1;
  load.meshes++;
  load.instances += instances;
  load.triangles += trianglesOf(mesh.geometry) * instances;
  load.drawCalls += drawnGroupsOf(mesh);
}

function trianglesOf(geometry: THREE.BufferGeometry): number {
  const vertices = geometry.index ? geometry.index.count : geometry.attributes.position!.count;
  return vertices / 3;
}

function drawnGroupsOf(mesh: THREE.Mesh): number {
  const groups = mesh.geometry.groups.filter((group) => group.count > 0);
  return Array.isArray(mesh.material) ? Math.max(1, groups.length) : 1;
}
