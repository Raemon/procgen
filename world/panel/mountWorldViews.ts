import type { AppRuntime } from '../../frontend/appRuntime';
import { cameraRelativeStep } from '../input/cameraRelativeStep';
import { facingRelativeStep } from '../input/facingRelativeStep';
import { MovementInput } from '../input/movementInput';
import { PickUpInput } from '../input/pickUpInput';
import { UseFixtureInput } from '../input/useFixtureInput';
import { AgentTextView } from '../render/agentText/agentTextView';
import { FeaturesView } from '../render/features/featuresView';
import { View3D } from '../render/view3d/view3d';
import { setWorldViewSnapshotter } from '../render/worldViewSnapshot';
import type { WorldViewDeps } from '../render/worldViewDeps';
import { isCharacterControlled, type ViewMode } from './viewMode';

export interface ViewSlots {
  view3d: HTMLElement;
  agentGod: HTMLElement;
  agentCharacter: HTMLElement;
  features: HTMLElement;
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
  const { world, sampler, tileAssets, perform } = runtime;
  const view3d = new View3D(slots.view3d, worldViewDepsOf(runtime));
  const agentGodView = new AgentTextView(
    slots.agentGod,
    world,
    sampler,
    tileAssets,
    'god',
    runtime.puzzles,
    runtime.hoveredTile,
  );
  const agentCharacterView = new AgentTextView(
    slots.agentCharacter,
    world,
    sampler,
    tileAssets,
    'character',
    runtime.puzzles,
    runtime.hoveredTile,
  );
  const featuresView = new FeaturesView(slots.features, worldViewDepsOf(runtime));

  setWorldViewSnapshotter((size, use) => view3d.captureAfterNextFrame(size, use));

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
    runtime.renderers.add({
      redraw: () => featuresView.draw(),
      recenterOnPlayer: () => featuresView.recenterOnPlayer(),
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
    isSuspended: () => inputIsSuspended(runtime, currentMode()),
  });

  const useFixture = new UseFixtureInput({
    use: () => perform(isCharacterControlled(currentMode()) ? 'use' : 'use_fixture'),
    resetRoom: () =>
      perform(isCharacterControlled(currentMode()) ? 'reset_room' : 'reset_puzzle_room'),
    isSuspended: () => inputIsSuspended(runtime, currentMode()),
  });

  const pickUp = new PickUpInput({
    pickUp: () => perform(isCharacterControlled(currentMode()) ? 'pick_up' : 'pick_up_item'),
    isSuspended: () => inputIsSuspended(runtime, currentMode()),
  });

  const redrawOnSightChange = world.on('sight-changed', () => {
    agentGodView.draw();
    agentCharacterView.draw();
  });

  const stopWalkingWhileTyping = runtime.chatComposer.subscribe(() => {
    if (runtime.chatComposer.isOpen()) movement.releaseHeldKeys();
  });

  const stopWalkingWhileBagIsOpen = runtime.playerInventoryPanel.subscribe(() => {
    if (runtime.playerInventoryPanel.isOpen()) movement.releaseHeldKeys();
  });

  runtime.applyWorldChange();

  return {
    dispose: () => {
      setWorldViewSnapshotter(null);
      redrawOnSightChange();
      stopWalkingWhileTyping();
      stopWalkingWhileBagIsOpen();
      movement.dispose();
      pickUp.dispose();
      useFixture.dispose();
      for (const remove of unregister) remove();
      featuresView.dispose();
      view3d.dispose();
      agentGodView.dispose();
      agentCharacterView.dispose();
    },
    onModeChanged: (mode) => {
      runtime.setPlayerMode(isCharacterControlled(mode) ? 'character' : 'god');
      view3d.setCameraStyle(mode === 'character' ? 'character' : 'god');
      runtime.hoveredTile.clear();
    },
  };
}

function inputIsSuspended(runtime: AppRuntime, mode: ViewMode): boolean {
  return runtime.chatComposer.isOpen() || runtime.playerInventoryPanel.isOpen() || mode === 'features';
}

function worldViewDepsOf(runtime: AppRuntime): WorldViewDeps {
  return {
    world: runtime.world,
    sampler: runtime.sampler,
    evaluator: runtime.evaluator,
    store: runtime.store,
    puzzles: runtime.puzzles,
    tileAssets: runtime.tileAssets,
    creatures: runtime.creatures,
    items: runtime.items,
    sim: runtime.sim,
    capture: runtime.capture,
    hoveredTile: runtime.hoveredTile,
    remotePlayers: runtime.net.remotePlayers,
    speech: runtime.net.speech,
  };
}
