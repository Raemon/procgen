import type { AppRuntime } from '../../app/appRuntime';
import { cameraRelativeStep } from '../../input/cameraRelativeStep';
import { MovementInput } from '../../input/movementInput';
import { AgentTextView } from '../../views/agentText/agentTextView';
import { View3D } from '../../views/view3d/view3d';
import type { WorldViewDeps } from '../../views/worldViewDeps';
import { FACING_NAMES, facingVector, type FacingIndex } from '../../world/facing';
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
      for (const action of moveActions(currentMode(), view3d, forwardInput, strafeInput)) {
        perform(action);
      }
    },
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

function moveActions(
  mode: ViewMode,
  view3d: View3D,
  forwardInput: number,
  strafeInput: number,
): string[] {
  if (isCharacterControlled(mode)) return characterMoveActions(forwardInput, strafeInput);
  const yawQuadrant = mode === '3d-god' ? view3d.yawQuadrant() : 0;
  const [dx, dy] = cameraRelativeStep(yawQuadrant, forwardInput, strafeInput);
  const name = compassNameOfStep(dx, dy);
  return name ? [`step_${name}`] : [];
}

function characterMoveActions(forwardInput: number, strafeInput: number): string[] {
  const actions: string[] = [];
  if (forwardInput > 0) actions.push('step_forward');
  if (forwardInput < 0) actions.push('step_back');
  if (strafeInput > 0) actions.push('strafe_right');
  if (strafeInput < 0) actions.push('strafe_left');
  return actions;
}

function compassNameOfStep(dx: number, dy: number): string | null {
  if (dx === 0 && dy === 0) return null;
  const facing = FACING_NAMES.findIndex((_, index) => {
    const vector = facingVector(index as FacingIndex);
    return vector.dx === dx && vector.dy === dy;
  });
  return facing < 0 ? null : FACING_NAMES[facing]!;
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
