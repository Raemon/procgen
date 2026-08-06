import type { RandomStream } from '../random/mulberry32';
import type {
  ChunkValue,
  FieldChunk,
  PointsChunk,
  TilesChunk,
  ValueKind,
} from './values/chunkValues';

export type ParamValue = number | string | boolean;

export type ParamSpec =
  | { kind: 'number'; label: string; help: string; min: number; max: number; step: number; default: number }
  | { kind: 'int'; label: string; help: string; min: number; max: number; default: number }
  | { kind: 'boolean'; label: string; help: string; default: boolean }
  | {
      kind: 'select';
      label: string;
      help: string;
      options: readonly string[];
      optionHelp: Record<string, string>;
      default: string;
    }
  | { kind: 'tile'; label: string; help: string }
  | { kind: 'text'; label: string; help: string; default: string }
  | { kind: 'code'; label: string; help: string; default: string };

export interface InputSpec {
  kind: ValueKind | 'any';
  label: string;
  help: string;
  optional?: boolean;
}

export interface ChunkGenCtx {
  readonly chunkX: number;
  readonly chunkY: number;
  readonly originX: number;
  readonly originY: number;
  readonly size: number;
  readonly params: Record<string, ParamValue>;
  rng(label: string): RandomStream;
  hashSeed(label: string): number;
  hash01(worldX: number, worldY: number, label: string): number;
  input(name: string): ChunkValue | null;
  inputAt(name: string, chunkX: number, chunkY: number): ChunkValue | null;
  fieldInput(name: string): FieldChunk | null;
  tilesInput(name: string): TilesChunk | null;
  pointsInput(name: string): PointsChunk | null;
  newField(): FieldChunk;
  newTiles(): TilesChunk;
}

export interface NodeTypeDef {
  type: string;
  title: string;
  category: string;
  description: string;
  whenToUse: string;
  inputs: Record<string, InputSpec>;
  params: Record<string, ParamSpec>;
  output: ValueKind | ((params: Record<string, ParamValue>) => ValueKind);
  generateChunk(ctx: ChunkGenCtx): ChunkValue;
}

export function outputKindOf(def: NodeTypeDef, params: Record<string, ParamValue>): ValueKind {
  return typeof def.output === 'function' ? def.output(params) : def.output;
}

export function defaultParamValue(spec: ParamSpec): ParamValue {
  return spec.kind === 'tile' ? -1 : spec.default;
}

export function defaultParams(def: NodeTypeDef): Record<string, ParamValue> {
  const params: Record<string, ParamValue> = {};
  for (const [name, spec] of Object.entries(def.params)) params[name] = defaultParamValue(spec);
  return params;
}
