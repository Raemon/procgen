import { readPersistedFile, writePersistedFile } from '../../frontend/persistence/repoFileStore';
import { isPieceRole, type PieceRole } from '../pieces/pieceDef';
import {
  MAX_STORY_LAYERS,
  MAX_WINDOW_EVERY,
  MIN_STORY_LAYERS,
  MIN_WINDOW_EVERY,
  noTilesChosenYet,
  type Culture,
} from './cultureDef';

const FILE_NAME = 'cultures';

export function loadStoredCultures(): Culture[] | null {
  return culturesFromStoredJson(readPersistedFile<unknown>(FILE_NAME));
}

export function culturesFromStoredJson(parsed: unknown): Culture[] | null {
  if (!Array.isArray(parsed)) return null;
  const cultures = parsed.filter(isCulture).map(withValidatedFields);
  return cultures.length > 0 ? cultures : null;
}

export function storeCultures(cultures: readonly Culture[]): void {
  writePersistedFile(FILE_NAME, cultures);
}

function isCulture(value: unknown): value is Culture {
  if (typeof value !== 'object' || value === null) return false;
  const culture = value as Partial<Culture>;
  return typeof culture.id === 'number' && typeof culture.name === 'string';
}

function withValidatedFields(stored: Culture): Culture {
  return {
    ...noTilesChosenYet(),
    ...stored,
    roleBindings: validatedRoleBindings(stored.roleBindings),
    roofStyle: stored.roofStyle === 1 ? 1 : 0,
    storyLayers: clamped(stored.storyLayers, MIN_STORY_LAYERS, MAX_STORY_LAYERS, 3),
    windowEvery: clamped(stored.windowEvery, MIN_WINDOW_EVERY, MAX_WINDOW_EVERY, 3),
  };
}

function validatedRoleBindings(stored: unknown): Partial<Record<PieceRole, number[]>> {
  const bindings: Partial<Record<PieceRole, number[]>> = {};
  if (typeof stored !== 'object' || stored === null) return bindings;
  for (const [role, ids] of Object.entries(stored)) {
    if (isPieceRole(role) && isPieceIdList(ids)) bindings[role] = [...ids];
  }
  return bindings;
}

function isPieceIdList(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((id) => typeof id === 'number' && id >= 0);
}

function clamped(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, Math.round(value)));
}
