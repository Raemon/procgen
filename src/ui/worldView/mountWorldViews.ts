import type { AppRuntime } from '../../app/appRuntime';
import { cameraRelativeStep, slideAlongEachAxis } from '../../input/cameraRelativeStep';
import { facingRelativeStep } from '../../input/facingRelativeStep';
import { MovementInput } from '../../input/movementInput';
import { AgentTextView } from '../../views/agentText/agentTextView';
import { View3D } from '../../views/view3d/view3d';
import type { WorldViewDeps } from '../../views/worldViewDeps';
import { isCharacterControlled, type ViewMode } from './viewMode';

export interface ViewSlots {
  view3d: HTMLElement;
  agentGod: HTMLElement;
  agentCharacter: HTMLElement;
}

export interface MountedWorldViews {
  dispose(): void;
  onModeChanged(mode: ViewMode): void;
}

export function mountWorldViews(
  runtime: AppRuntime,
  slots: ViewSlots,
  currentMode: () => ViewMode,
): MountedWorldViews {
  const { world, sampler, tileset, questInventory } = runtime;
  const view3d = new View3D(slots.view3d, worldViewDepsOf(runtime));
  const agentGodView = new AgentTextView(slots.agentGod, world, sampler, tileset, questInventory, 'god');
  const agentCharacterView = new AgentTextView(
    slots.agentCharacter,
    world,
    sampler,
    tileset,
    questInventory,
    'character',
  );

  const unregister = [
    runtime.renderers.add({
      redraw: () => view3d.onWorldChanged(),
      recenterOnPlayer: () => view3d.recenterOnPlayer(),
    }),
    runtime.renderers.add({
      redraw: () => agentGodView.draw(),
      recenterOnPlayer: () => agentGodView.draw(),
    }),
    runtime.renderers.add({
      redraw: () => agentCharacterView.draw(),
      recenterOnPlayer: () => agentCharacterView.draw(),
    }),
  ];

  const movement = new MovementInput({
    moveIntent: (forwardInput, strafeInput) => {
      const step = isCharacterControlled(currentMode())
        ? facingRelativeStep(world.facing, forwardInput, strafeInput)
        : cameraRelativeStep(godYawQuadrant(currentMode(), view3d), forwardInput, strafeInput);
      slideAlongEachAxis(step, (dx, dy) => world.tryStep(dx, dy));
    },
    rotate: (direction) => {
      if (isCharacterControlled(currentMode())) world.turn(direction);
      else if (currentMode() === '3d-god') view3d.rotate(direction);
    },
  });

  runtime.applyWorldChange();

  return {
    dispose: () => {
      movement.dispose();
      for (const remove of unregister) remove();
      view3d.dispose();
      agentGodView.dispose();
      agentCharacterView.dispose();
    },
    onModeChanged: (mode) => {
      view3d.setCameraStyle(mode === 'character' ? 'character' : 'god');
    },
  };
}

function godYawQuadrant(mode: ViewMode, view3d: View3D): number {
  return mode === '3d-god' ? view3d.yawQuadrant() : 0;
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
