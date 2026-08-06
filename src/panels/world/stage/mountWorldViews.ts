import type { AppRuntime } from '../../../app/appRuntime';
import { MovementInput } from '../movement/movementInput';
import { AsciiView } from '../ascii/asciiView';
import { View3D } from '../view3d/view3d';
import type { ViewMode } from '../viewMode';

export interface ViewSlots {
  ascii: HTMLElement;
  view3d: HTMLElement;
}

export function mountWorldViews(
  runtime: AppRuntime,
  slots: ViewSlots,
  currentMode: () => ViewMode,
): () => void {
  const { world, sampler, tileset } = runtime;
  const asciiView = new AsciiView(slots.ascii, world, sampler, tileset);
  const view3d = new View3D(slots.view3d, world, sampler, tileset);

  const unregister = [
    runtime.renderers.add({
      redraw: () => asciiView.draw(),
      recenterOnPlayer: () => asciiView.recenterOnPlayer(),
    }),
    runtime.renderers.add({
      redraw: () => view3d.onWorldChanged(),
      recenterOnPlayer: () => view3d.recenterOnPlayer(),
    }),
  ];

  const movement = new MovementInput({
    step: (dx, dy) => world.tryStep(dx, dy),
    rotate: (direction) => view3d.rotate(direction),
    yawQuadrant: () => (currentMode() === '3d' ? view3d.yawQuadrant() : 0),
  });

  runtime.applyWorldChange();

  return () => {
    movement.dispose();
    for (const remove of unregister) remove();
    asciiView.dispose();
    view3d.dispose();
  };
}
