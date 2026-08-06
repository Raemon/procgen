import type { AppRuntime } from '../../app/appRuntime';
import { MovementInput } from '../../input/movementInput';
import { AsciiView } from '../../views/ascii/asciiView';
import { View3D } from '../../views/view3d/view3d';
import type { WorldViewDeps } from '../../views/worldViewDeps';
import type { ViewMode } from './viewMode';

export interface ViewSlots {
  ascii: HTMLElement;
  view3d: HTMLElement;
}

export function mountWorldViews(
  runtime: AppRuntime,
  slots: ViewSlots,
  currentMode: () => ViewMode,
): () => void {
  const deps = worldViewDepsOf(runtime);
  const asciiView = new AsciiView(slots.ascii, deps);
  const view3d = new View3D(slots.view3d, deps);

  const unregister = [
    runtime.renderers.add({
      redraw: () => asciiView.draw(),
      recenterOnPlayer: () => asciiView.recenterOnPlayer(),
    }),
    runtime.renderers.add({
      redraw: () => view3d.onWorldChanged(),
      recenterOnPlayer: () => view3d.recenterOnPlayer(),
    }),
    runtime.clock.onRedraw(() => asciiView.draw()),
    runtime.capture.onChange(() => asciiView.draw()),
  ];

  const movement = new MovementInput({
    step: (dx, dy) => runtime.world.tryStep(dx, dy),
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

function worldViewDepsOf(runtime: AppRuntime): WorldViewDeps {
  return {
    world: runtime.world,
    sampler: runtime.sampler,
    tileset: runtime.tileset,
    creatures: runtime.creatures,
    sim: runtime.sim,
    capture: runtime.capture,
  };
}
