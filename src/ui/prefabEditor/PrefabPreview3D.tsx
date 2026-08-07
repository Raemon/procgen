import { useEffect, useRef } from 'react';
import type { Prefab } from '../../prefabs/prefabDef';
import type { ReadOnlyTileset } from '../../app/readOnlyLibraries';
import { tooltipHandlers } from '../tooltips/tooltipHandlers';
import { ORBIT_TIP } from './help/prefabTips';
import { PrefabPreviewScene } from './prefabPreviewScene';

export function PrefabPreview3D({ prefab, tileset }: { prefab: Prefab; tileset: ReadOnlyTileset }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<PrefabPreviewScene | null>(null);

  useEffect(() => {
    scene.current = new PrefabPreviewScene(canvas.current!);
    return () => {
      scene.current?.dispose();
      scene.current = null;
    };
  }, []);

  useEffect(() => scene.current?.showPrefab(prefab, tileset));

  return (
    <canvas
      ref={canvas}
      {...tooltipHandlers(ORBIT_TIP)}
      className="mt-1.5 block h-32 w-full cursor-grab touch-none rounded-[3px] border border-art-edge"
    />
  );
}
