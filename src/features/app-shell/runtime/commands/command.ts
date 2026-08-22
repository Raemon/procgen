import type { CreatureAssets } from '@/features/asset-library/creatures/creatureAssets';
import type { ItemAssets } from '@/features/asset-library/items/itemAssets';
import type { GroundItems } from '@/features/asset-library/items/pickups/groundItems';
import type { CultureAssets } from '@/features/asset-library/cultures/cultureAssets';
import type { PieceAssets } from '@/features/asset-library/pieces/pieceAssets';
import type { PuzzleWorld } from '@/features/game/puzzles/puzzleWorld';
import type { RegionSampler } from '@/features/asset-library/pieces/captureRegionAsPiece';
import type { WorldLab } from '@/features/asset-library/worlds/lab/worldLab';
import type { WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import type { PipelineStore } from '@/features/asset-library/worlds/pipeline/pipelineStore';
import type { RunningWorld } from '@/features/asset-library/worlds/presets/runningWorld';
import type { WorldPresetLibrary } from '@/features/asset-library/worlds/presets/worldPresetLibrary';
import type { RandomizeHistory } from '@/features/asset-library/worlds/randomize/randomizeHistory';
import type { TemplateLibrary } from '@/features/asset-library/node-groups/templateLibrary';
import type { TileAssets } from '@/features/asset-library/tiles/tileAssets';
import type { FacingIndex } from '@/features/game/facing';

export type CommandMode = 'god' | 'character';
export type CommandGroup = 'movement' | 'senses' | 'pipeline' | 'assets' | 'world';

export interface CommandActor {
  pose(): { x: number; y: number; facing: FacingIndex };
  tryStep(dx: number, dy: number, mayPush?: boolean): boolean;
  turn(eighthTurns: number): void;
  sightRadiusTiles(): number;
  setSightRadiusTiles(radius: number): void;
}

export interface CommandContext {
  store: PipelineStore;
  tileAssets: TileAssets;
  pieces: PieceAssets;
  cultures: CultureAssets;
  creatures: CreatureAssets;
  items: ItemAssets;
  templates: TemplateLibrary;
  worldPresets: WorldPresetLibrary;
  runningWorld: RunningWorld;
  randomizeHistory: RandomizeHistory;
  regionSampler: RegionSampler;
  worldSampler: WorldSampler;
  lab: WorldLab | null;
  groundItems: GroundItems;
  puzzles: PuzzleWorld;
  actor: CommandActor;
}

export type CommandParamKind = 'int' | 'number' | 'text' | 'nodeId' | 'json';

export interface CommandParamSpec {
  kind: CommandParamKind;
  help: string;
  optional?: boolean;
}

export type CommandResult =
  | { ok: true; summary: string }
  | { ok: false; code: string; hint: string };

export type CommandParams = Record<string, unknown>;

export type CommandParamSpecs = Record<string, CommandParamSpec>;

export interface CommandSpec {
  action: string;
  mode: CommandMode;
  group: CommandGroup;
  humanControl: string;
  description: string;
  params: CommandParamSpecs;
  example: CommandParams;
  changesWorld: boolean;
  apply(context: CommandContext, params: CommandParams): CommandResult;
}

export function commandSucceeded(summary: string): CommandResult {
  return { ok: true, summary };
}

export function commandFailed(code: string, hint: string): CommandResult {
  return { ok: false, code, hint };
}
