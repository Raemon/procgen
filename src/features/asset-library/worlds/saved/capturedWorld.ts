import type { FacingIndex } from '@/features/game/facing';
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
    puzzles: context.puzzles.state.snapshot(),
  };
}

export function restoreSavedWorld(context: CommandContext, saved: SavedWorld): void {
  context.store.replaceAll(sanitizePipeline(structuredClone(saved.state)));
  context.takenItems.replaceAll(saved.takenItems);
  context.puzzles.state.replaceAll(saved.puzzles);
  context.actor.snapTo(saved.player.x, saved.player.y, saved.player.facing as FacingIndex);
}

export function holdsWhatIsRunning(saved: SavedWorld, live: SavedWorld): boolean {
  return JSON.stringify({ ...saved, name: '', description: '' }) ===
    JSON.stringify({ ...live, name: '', description: '' });
}
