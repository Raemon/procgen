import type { TakenSpawnKey } from '@/features/asset-library/items/pickups/takenItemSpawns';
import type { DroppedItem } from '@/features/asset-library/items/pickups/droppedItemSpawns';
import type { InventoryPlacement } from '@/features/asset-library/items/inventory/inventoryDef';
import type { PuzzleStateSnapshot } from '@/features/game/puzzles/state/puzzleState';
import { sanitizePipeline } from '../pipeline/sanitizePipeline';
import type { PipelineState } from '../pipeline/pipelineState';

export interface SavedPlayerPose {
  x: number;
  y: number;
  facing: number;
}

export interface SavedWorld {
  name: string;
  description: string;
  seededBy: string;
  state: PipelineState;
  player: SavedPlayerPose;
  takenItems: TakenSpawnKey[];
  slainCreatures: string[];
  droppedItems: DroppedItem[];
  carried: InventoryPlacement[];
  puzzles: PuzzleStateSnapshot;
}

export function sanitizeSavedWorld(raw: unknown): SavedWorld | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const held = raw as Record<string, unknown>;
  if (typeof held.name !== 'string' || held.name.trim() === '') return null;
  const state = sanitizePipeline(held.state);
  if (state.nodes.length === 0) return null;
  return {
    name: held.name.trim(),
    description: typeof held.description === 'string' ? held.description : '',
    seededBy: typeof held.seededBy === 'string' ? held.seededBy : '',
    state,
    player: sanitizePose(held.player),
    takenItems: sanitizeTakenItems(held.takenItems),
    slainCreatures: sanitizeSlainCreatures(held.slainCreatures),
    droppedItems: sanitizeDroppedItems(held.droppedItems),
    carried: sanitizeCarried(held.carried),
    puzzles: sanitizePuzzles(held.puzzles),
  };
}

export function sanitizeSavedWorlds(raw: unknown): SavedWorld[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(sanitizeSavedWorld).filter((saved): saved is SavedWorld => saved !== null);
}

function sanitizePose(raw: unknown): SavedPlayerPose {
  const held = (raw ?? {}) as { x?: unknown; y?: unknown; facing?: unknown };
  return {
    x: wholeNumber(held.x),
    y: wholeNumber(held.y),
    facing: wholeNumber(held.facing),
  };
}

function sanitizeTakenItems(raw: unknown): TakenSpawnKey[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null)
    .filter((entry) => [entry.x, entry.y, entry.itemId].every(isFiniteNumber))
    .map((entry) => ({
      x: entry.x as number,
      y: entry.y as number,
      itemId: entry.itemId as TakenSpawnKey['itemId'],
    }));
}

function sanitizeSlainCreatures(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((key): key is string => typeof key === 'string' && key !== '');
}

function sanitizeDroppedItems(raw: unknown): DroppedItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null)
    .filter((entry) => [entry.x, entry.y, entry.itemId].every(isFiniteNumber))
    .map((entry) => ({
      x: Math.round(entry.x as number),
      y: Math.round(entry.y as number),
      itemId: entry.itemId as DroppedItem['itemId'],
    }));
}

function sanitizeCarried(raw: unknown): InventoryPlacement[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null)
    .filter((entry) => [entry.itemId, entry.x, entry.y].every(isFiniteNumber))
    .map((entry) => ({
      itemId: entry.itemId as InventoryPlacement['itemId'],
      x: entry.x as number,
      y: entry.y as number,
    }));
}

function sanitizePuzzles(raw: unknown): PuzzleStateSnapshot {
  const held = (raw ?? {}) as { on?: unknown; crates?: unknown };
  return {
    on: Array.isArray(held.on) ? held.on.filter((id): id is string => typeof id === 'string') : [],
    crates: Array.isArray(held.crates)
      ? held.crates.filter(
          (crate): crate is [string, number, number] =>
            Array.isArray(crate) &&
            crate.length === 3 &&
            typeof crate[0] === 'string' &&
            isFiniteNumber(crate[1]) &&
            isFiniteNumber(crate[2]),
        )
      : [],
  };
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function wholeNumber(value: unknown): number {
  return isFiniteNumber(value) ? Math.round(value) : 0;
}
