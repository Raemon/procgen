import type { AssetFolders } from '@/features/asset-library/folders/assetFolders';
import type { CreatureAssets } from '@/features/asset-library/creatures/creatureAssets';
import type { ItemAssets } from '@/features/asset-library/items/itemAssets';
import type { GroundItems } from '@/features/asset-library/items/pickups/groundItems';
import type { CultureAssets } from '@/features/asset-library/cultures/cultureAssets';
import type { PieceAssets } from '@/features/asset-library/pieces/pieceAssets';
import type { KeyPurse } from '@/features/game/puzzles/interaction/keyPurse';
import type { PuzzleWorld } from '@/features/game/puzzles/puzzleWorld';
import type { RegionSampler } from '@/features/asset-library/pieces/captureRegionAsPiece';
import type { WorldSeedLab } from '@/features/asset-library/worlds/lab/worldSeedLab';
import type { WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import type { PipelineStore } from '@/features/asset-library/worlds/pipeline/pipelineStore';
import type { RunningWorld } from '@/features/asset-library/worlds/running/runningWorld';
import type { WorldSeedLibrary } from '@/features/asset-library/worlds/seeds/worldSeedLibrary';
import type { SavedWorldLibrary } from '@/features/asset-library/worlds/saved/savedWorldLibrary';
import type { TakenItemSpawns } from '@/features/asset-library/items/pickups/takenItemSpawns';
import type { RandomizeHistory } from '@/features/asset-library/worlds/randomize/randomizeHistory';
import type { TemplateLibrary } from '@/features/asset-library/node-groups/templateLibrary';
import type { TileAssets } from '@/features/asset-library/tiles/tileAssets';
import type { FacingIndex } from '@/features/game/facing';

export type CommandMode = 'god' | 'character';
export type CommandGroup = 'movement' | 'senses' | 'pipeline' | 'assets' | 'world';

export interface CommandActor {
  pose(): { x: number; y: number; facing: FacingIndex };
  snapTo(x: number, y: number, facing: FacingIndex): void;
  tryStep(dx: number, dy: number, mayPush?: boolean): boolean;
  tryJump(dx: number, dy: number): boolean;
  turn(eighthTurns: number): void;
  sightRadiusTiles(): number;
  setSightRadiusTiles(radius: number): void;
  godViewSizeTiles(): number;
  setGodViewSizeTiles(sizeTiles: number): void;
}

export interface CommandContext {
  store: PipelineStore;
  pipelineIsOnScreen: boolean;
  tileAssets: TileAssets;
  pieces: PieceAssets;
  cultures: CultureAssets;
  creatures: CreatureAssets;
  items: ItemAssets;
  templates: TemplateLibrary;
  assetFolders: AssetFolders;
  worldSeeds: WorldSeedLibrary;
  savedWorlds: SavedWorldLibrary;
  takenItems: TakenItemSpawns;
  runningWorld: RunningWorld;
  randomizeHistory: RandomizeHistory;
  regionSampler: RegionSampler;
  worldSampler: WorldSampler;
  lab: WorldSeedLab | null;
  groundItems: GroundItems;
  puzzles: PuzzleWorld;
  keyPurse: KeyPurse;
  actor: CommandActor;
  settleTheWorld(change: () => void): void;
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
