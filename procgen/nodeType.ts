import type { RandomStream } from './random/mulberry32';
import type {
  ChunkValue,
  FieldChunk,
  PointsChunk,
  TilesChunk,
  ValueKind,
} from './values/chunkValues';

export type ParamValue = number | string;

interface ChoiceOption {
  value: number;
  label: string;
  help: string;
}

export type KnobParamSpec =
  | { kind: 'number'; label: string; help: string; min: number; max: number; step: number; default: number }
  | { kind: 'int'; label: string; help: string; min: number; max: number; default: number }
  | { kind: 'choice'; label: string; help: string; options: readonly ChoiceOption[]; default: number }
  | { kind: 'toggle'; label: string; help: string; default: 0 | 1 }
  | { kind: 'tile'; label: string; help: string };

type ScriptOnlyParamSpec =
  | {
      kind: 'select';
      label: string;
      help: string;
      options: readonly string[];
      optionHelp: Record<string, string>;
      default: string;
    }
  | { kind: 'code'; label: string; help: string; default: string };

export type ParamSpec = KnobParamSpec | ScriptOnlyParamSpec;

const KNOB_PARAM_KINDS = ['number', 'int', 'choice', 'toggle', 'tile'] as const;

export function isKnobParamSpec(spec: ParamSpec): spec is KnobParamSpec {
  return (KNOB_PARAM_KINDS as readonly string[]).includes(spec.kind);
}

export interface InputSpec {
  kind: ValueKind | 'any';
  label: string;
  help: string;
  optional?: boolean;
}

export interface ChunkGenCtx {
  readonly nodeId: string;
  readonly time: number;
  readonly chunkX: number;
  readonly chunkY: number;
  readonly originX: number;
  readonly originY: number;
  readonly size: number;
  readonly params: Record<string, ParamValue>;
  rng(label: string): RandomStream;
  rngAt(gridX: number, gridY: number, label: string): RandomStream;
  hashSeed(label: string): number;
  hash01(worldX: number, worldY: number, label: string): number;
  input(name: string): ChunkValue | null;
  inputAt(name: string, chunkX: number, chunkY: number): ChunkValue | null;
  fieldInput(name: string): FieldChunk | null;
  tilesInput(name: string): TilesChunk | null;
  pointsInput(name: string): PointsChunk | null;
  newField(): FieldChunk;
  newTiles(): TilesChunk;
  memo<Value>(key: string, compute: () => Value): Value;
}

export interface NodeTypeDef {
  type: string;
  title: string;
  category: string;
  description: string;
  whenToUse: string;
  readsTime?: true;
  inputs: Record<string, InputSpec>;
  params: Record<string, ParamSpec>;
  output: ValueKind | ((params: Record<string, ParamValue>) => ValueKind);
  generateChunk(ctx: ChunkGenCtx): ChunkValue;
}

export interface StandardNodeTypeDef extends Omit<NodeTypeDef, 'params'> {
  params: Record<string, KnobParamSpec>;
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
