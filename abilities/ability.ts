import type { CreatureAssets } from '../assets/creatures/creatureAssets';
import type { ItemAssets } from '../assets/items/itemAssets';
import type { GroundItems } from '../assets/items/pickups/groundItems';
import type { PieceAssets } from '../assets/pieces/pieceAssets';
import type { PuzzleWorld } from '../world/puzzles/puzzleWorld';
import type { RegionSampler } from '../assets/pieces/captureRegionAsPiece';
import type { PipelineStore } from '../procgen/pipeline/pipelineStore';
import type { WorldPresetLibrary } from '../procgen/presets/worldPresetLibrary';
import type { RandomizeHistory } from '../procgen/randomize/randomizeHistory';
import type { TemplateLibrary } from '../procgen/templates/templateLibrary';
import type { TileAssets } from '../assets/tiles/tileAssets';
import type { FacingIndex } from '../world/facing';

export type AbilityMode = 'god' | 'character';
export type AbilityGroup = 'movement' | 'senses' | 'pipeline' | 'assets' | 'world';

export interface AbilityActor {
  pose(): { x: number; y: number; facing: FacingIndex };
  tryStep(dx: number, dy: number, mayPush?: boolean): boolean;
  turn(eighthTurns: number): void;
  sightRadiusTiles(): number;
  setSightRadiusTiles(radius: number): void;
}

export interface AbilityContext {
  store: PipelineStore;
  tileAssets: TileAssets;
  pieces: PieceAssets;
  creatures: CreatureAssets;
  items: ItemAssets;
  templates: TemplateLibrary;
  worldPresets: WorldPresetLibrary;
  randomizeHistory: RandomizeHistory;
  regionSampler: RegionSampler;
  groundItems: GroundItems;
  puzzles: PuzzleWorld;
  actor: AbilityActor;
}

export type AbilityParamKind = 'int' | 'number' | 'text' | 'nodeId' | 'json';

export interface AbilityParamSpec {
  kind: AbilityParamKind;
  help: string;
  optional?: boolean;
}

export type AbilityResult =
  | { ok: true; summary: string }
  | { ok: false; code: string; hint: string };

export interface AbilitySpec {
  action: string;
  mode: AbilityMode;
  group: AbilityGroup;
  humanControl: string;
  description: string;
  params: Record<string, AbilityParamSpec>;
  example: Record<string, unknown>;
  changesWorld: boolean;
  apply(context: AbilityContext, params: Record<string, unknown>): AbilityResult;
}

export function abilitySucceeded(summary: string): AbilityResult {
  return { ok: true, summary };
}

export function abilityFailed(code: string, hint: string): AbilityResult {
  return { ok: false, code, hint };
}
