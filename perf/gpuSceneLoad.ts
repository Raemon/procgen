export interface GpuSceneLoad {
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  programs: number;
}

let readLoad: (() => GpuSceneLoad) | null = null;

export function reportGpuSceneLoad(read: () => GpuSceneLoad): () => void {
  readLoad = read;
  return () => {
    if (readLoad === read) readLoad = null;
  };
}

export function gpuSceneLoad(): GpuSceneLoad | null {
  return readLoad?.() ?? null;
}
