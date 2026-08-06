import type { CreatureLibrary } from '../creatures/creatureLibrary';
import type { PrefabLibrary } from '../prefabs/prefabLibrary';
import type { RegionSampler } from '../prefabs/captureRegionAsPrefab';
import type { PipelineStore } from '../procgen/pipeline/pipelineStore';
import type { WorldPresetLibrary } from '../procgen/presets/worldPresetLibrary';
import type { RandomizeHistory } from '../procgen/randomize/randomizeHistory';
import type { TemplateLibrary } from '../procgen/templates/templateLibrary';
import type { SpokenWorldLedger } from '../spokenWorld/spokenWorldLedger';
import type { Tileset } from '../world/tiles/tileset';
import type { FacingIndex } from '../world/facing';

export type AbilityMode = 'god' | 'character';
export type AbilityGroup = 'movement' | 'pipeline' | 'library' | 'world';

export interface AbilityActor {
  pose(): { x: number; y: number; facing: FacingIndex };
  tryStep(dx: number, dy: number): boolean;
  turn(eighthTurns: number): void;
}

export interface AbilityContext {
  store: PipelineStore;
  tileset: Tileset;
  prefabs: PrefabLibrary;
  creatures: CreatureLibrary;
  templates: TemplateLibrary;
  worldPresets: WorldPresetLibrary;
  randomizeHistory: RandomizeHistory;
  regionSampler: RegionSampler;
  spokenWorld: SpokenWorldLedger;
  placesNear(minX: number, minY: number, maxX: number, maxY: number): { x: number; y: number; tag: string }[];
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
