import type { TakenSpawnKey } from '@/features/asset-library/items/pickups/takenItemSpawns';
import type { InventoryPlacement } from '@/features/asset-library/items/inventory/inventoryDef';
import { worldRulesFor } from '@/features/game/worldRules';
import { LABYRINTH_NODE_TYPE } from '../labyrinth/labyrinthKnobs';
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
  carried: InventoryPlacement[];
  shared: Record<string, unknown>;
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
    carried: sanitizeCarried(held.carried),
    shared: sanitizeShared(held.shared, held.puzzles),
  };
}

export function describeShared(saved: Pick<SavedWorld, 'state' | 'shared'>): string {
  const described = Object.entries(saved.shared).map(([nodeId, state]) => {
    const nodeType = saved.state.nodes.find((node) => node.id === nodeId)?.type ?? nodeId;
    return worldRulesFor(nodeType)?.describe?.(state) ?? `${nodeType} worked`;
  });
  return described.length === 0 ? 'nothing worked yet' : described.join(', ');
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

function sanitizeShared(raw: unknown, legacyPuzzles: unknown): Record<string, unknown> {
  const shared: Record<string, unknown> = {};
  if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) {
    for (const [nodeId, state] of Object.entries(raw as Record<string, unknown>)) {
      if (typeof state === 'object' && state !== null) shared[nodeId] = state;
    }
  }
  if (typeof legacyPuzzles === 'object' && legacyPuzzles !== null && !(LABYRINTH_NODE_TYPE in shared)) {
    shared[LABYRINTH_NODE_TYPE] = legacyPuzzles;
  }
  return shared;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function wholeNumber(value: unknown): number {
  return isFiniteNumber(value) ? Math.round(value) : 0;
}
