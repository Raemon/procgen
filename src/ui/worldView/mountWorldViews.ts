import type { AppRuntime } from '../../app/appRuntime';
import { cameraRelativeStep } from '../../input/cameraRelativeStep';
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
  const { world, sampler, tileset, perform } = runtime;
  const view3d = new View3D(slots.view3d, worldViewDepsOf(runtime));
  const agentGodView = new AgentTextView(slots.agentGod, world, sampler, tileset, 'god');
  const agentCharacterView = new AgentTextView(
    slots.agentCharacter,
    world,
    sampler,
    tileset,
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
      const [dx, dy] = isCharacterControlled(currentMode())
        ? facingRelativeStep(world.facing, forwardInput, strafeInput)
        : cameraRelativeStep(currentMode() === '3d-god' ? view3d.yawQuadrant() : 0, forwardInput, strafeInput);
      runtime.net.setMoveIntent(dx, dy);
    },
    moveReleased: () => runtime.net.clearMoveIntent(),
    rotate: (direction) => {
      if (isCharacterControlled(currentMode())) perform(direction === -1 ? 'turn_left' : 'turn_right');
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
      runtime.setPlayerMode(isCharacterControlled(mode) ? 'character' : 'god');
      view3d.setCameraStyle(mode === 'character' ? 'character' : 'god');
    },
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
    remotePlayers: runtime.net.remotePlayers,
  };
}
