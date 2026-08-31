import { useEffect, useRef, useState } from 'react';
import { classes } from '@/features/app-shell/controls/classes';
import { tooltipHandlers } from '@/features/app-shell/tooltips/tooltipHandlers';
import type { PipelineState } from '@/features/asset-library/worlds/pipeline/pipelineState';
import { selectSeedTip } from './help/worldsTips';
import { growSeedWorld, type SeedWorld, type SeedWorldAssets } from './seedWorld';
import { SeedWorldAsciiView } from './seedWorldAsciiView';
import { SeedWorldGodView } from './seedWorldGodView';
import { WorldsCameraToggle } from './WorldsCameraToggle';
import type { WorldsCamera } from './worldsCamera';

interface SeedWorldView {
  setWorld(world: SeedWorld): void;
  setZoom(zoom: number): void;
  dispose(): void;
}

export function WorldSeedCell({
  seed,
  selected,
  camera,
  zoom,
  pipeline,
  assets,
  onSelect,
}: {
  seed: number;
  selected: boolean;
  camera: WorldsCamera;
  zoom: number;
  pipeline: PipelineState;
  assets: SeedWorldAssets;
  onSelect(): void;
}) {
  const slot = useRef<HTMLSpanElement>(null);
  const viewRef = useRef<SeedWorldView | null>(null);
  const pipelineRef = useRef(pipeline);
  pipelineRef.current = pipeline;
  const [world, setWorld] = useState<SeedWorld | null>(null);
  const [cellCamera, setCellCamera] = useState(camera);
  useEffect(() => setCellCamera(camera), [camera]);

  useEffect(() => {
    const grown = growSeedWorld(pipelineRef.current, seed, assets);
    setWorld(grown);
  }, [seed, assets]);

  useEffect(() => {
    if (!world) return;
    world.syncPipeline(pipeline);
    viewRef.current?.setWorld(world);
  }, [world, pipeline]);

  useEffect(() => {
    if (!world || !slot.current) return;
    const view = mountView(slot.current, world, assets, cellCamera, zoom);
    viewRef.current = view;
    return () => {
      view.dispose();
      viewRef.current = null;
    };
  }, [world, cellCamera, assets]);

  useEffect(() => {
    viewRef.current?.setZoom(zoom);
  }, [zoom]);

  return (
    <div className="relative h-full min-h-0 min-w-0">
      <button
        type="button"
        aria-pressed={selected}
        className={classes(
          'absolute inset-0 cursor-pointer overflow-hidden bg-black',
          selected ? 'outline-accent outline-solid outline-1 -outline-offset-1' : null,
        )}
        onClick={onSelect}
        {...tooltipHandlers(selectSeedTip(seed, selected))}
      >
        <span ref={slot} className="absolute inset-0" />
      </button>
      <span
        className="absolute top-0.5 right-0.5 z-10"
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <WorldsCameraToggle camera={cellCamera} onChoose={setCellCamera} />
      </span>
      <span className="pointer-events-none absolute bottom-0.5 left-1 text-[10px] text-white">
        {seed}
      </span>
    </div>
  );
}

function mountView(
  slot: HTMLElement,
  world: SeedWorld,
  assets: SeedWorldAssets,
  camera: WorldsCamera,
  zoom: number,
): SeedWorldView {
  if (camera === 'ascii') {
    return new SeedWorldAsciiView(slot, world, assets.tileAssets, zoom);
  }
  try {
    return new SeedWorldGodView(slot, world, assets.tileAssets, zoom);
  } catch {
    return new SeedWorldAsciiView(slot, world, assets.tileAssets, zoom);
  }
}
