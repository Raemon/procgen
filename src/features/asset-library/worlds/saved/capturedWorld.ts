import type { FacingIndex } from '@/features/game/facing';
import { playerCharacterDef } from '@/features/asset-library/characters/playerCharacter';
import type { CommandContext } from '@/features/app-shell/runtime/commands/command';
import { sanitizePipeline } from '../pipeline/sanitizePipeline';
import type { SavedWorld } from './savedWorld';

export function capturedWorld(
  context: CommandContext,
  name: string,
  description: string,
  seededBy: string,
): SavedWorld {
  const pose = context.actor.pose();
  return {
    name,
    description,
    seededBy,
    state: sanitizePipeline(structuredClone(context.store.snapshot())),
    player: { x: pose.x, y: pose.y, facing: pose.facing },
    takenItems: context.takenItems.snapshot(),
    slainCreatures: context.slainCreatures.snapshot(),
    droppedItems: context.droppedItems.snapshot(),
    carried: carriedBy(context),
    puzzles: context.puzzles.state.snapshot(),
  };
}

export function restoreSavedWorld(context: CommandContext, saved: SavedWorld): void {
  context.settleTheWorld(() => {
    context.store.replaceAll(sanitizePipeline(structuredClone(saved.state)));
    context.takenItems.replaceAll(saved.takenItems);
    context.slainCreatures.replaceAll(saved.slainCreatures);
    context.droppedItems.replaceAll(saved.droppedItems);
    context.puzzles.state.replaceAll(saved.puzzles);
    restoreCarried(context, saved);
    context.actor.snapTo(saved.player.x, saved.player.y, saved.player.facing as FacingIndex);
  });
}

export function forgetWhatWasDoneInTheLastWorld(context: CommandContext): void {
  context.takenItems.forgetAll();
  context.slainCreatures.forgetAll();
  context.droppedItems.forgetAll();
  context.puzzles.state.forgetAll();
}

function carriedBy(context: CommandContext): SavedWorld['carried'] {
  const carrier = playerCharacterDef(context.creatures);
  return structuredClone(carrier?.inventory?.placements ?? []);
}

function restoreCarried(context: CommandContext, saved: SavedWorld): void {
  const carrier = playerCharacterDef(context.creatures);
  if (!carrier?.inventory) return;
  context.creatures.update(carrier.id, {
    inventory: { ...carrier.inventory, placements: structuredClone(saved.carried) },
  });
}
