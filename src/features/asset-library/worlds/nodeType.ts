import type { RandomStream } from './random/mulberry32';
import type {
  ChunkValue,
  FieldChunk,
  PointsChunk,
  TilesChunk,
  ValueKind,
} from './values/chunkValues';

export type ParamValue = number | string;

export interface ChoiceOption {
  value: number;
  label: string;
  help: string;
}

export interface ParamGate {
  visibleWhen?: { param: string; equals: ParamValue };
}

export type KnobParamSpec = ParamGate &
  (
    | { kind: 'number'; label: string; help: string; min: number; max: number; step: number; default: number }
    | { kind: 'int'; label: string; help: string; min: number; max: number; default: number }
    | { kind: 'choice'; label: string; help: string; options: readonly ChoiceOption[]; default: number }
    | { kind: 'toggle'; label: string; help: string; default: 0 | 1 }
    | { kind: 'tile'; label: string; help: string }
    | { kind: 'pointKey'; label: string; help: string; from: string; default: string }
  );

export type ScriptOnlyParamSpec = ParamGate &
  (
    | {
        kind: 'select';
        label: string;
        help: string;
        options: readonly string[];
        optionHelp: Record<string, string>;
        default: string;
      }
    | { kind: 'code'; label: string; help: string; default: string }
  );

export type ParamSpec = KnobParamSpec | ScriptOnlyParamSpec;

export const KNOB_PARAM_KINDS = ['number', 'int', 'choice', 'toggle', 'tile', 'pointKey'] as const;

export function isKnobParamSpec(spec: ParamSpec): spec is KnobParamSpec {
  return (KNOB_PARAM_KINDS as readonly string[]).includes(spec.kind);
}

export type FieldSemantic = 'unit' | 'elevation' | 'mask' | 'cost' | 'years' | 'distance' | 'raw';

export const FIELD_SEMANTIC_MEANINGS: Readonly<Record<FieldSemantic, string>> = {
  unit: 'a 0..1 reading where 0 is none and 1 is all of it',
  elevation: 'a 0..1 ground height, the field an elevation display expects',
  mask: 'a 0..1 weight meant to gate or blend something else',
  cost: 'what crossing a tile costs, 1 and upward, with no ceiling',
  years: 'a world-time date, where 0 usually means never',
  distance: 'how far away something is',
  raw: 'whatever the source put there — no range is promised',
};

export interface PointAttrSpec {
  key: string;
  label: string;
  help: string;
  units?: 'years' | 'tiles' | 'unit' | 'id';
}

export interface InputSpec {
  kind: ValueKind | 'any';
  label: string;
  help: string;
  optional?: boolean;
  expects?: FieldSemantic;
  requiresPointAttributes?: readonly string[];
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
  outputSemantic?: FieldSemantic | ((params: Record<string, ParamValue>) => FieldSemantic);
  pointAttributes?: readonly PointAttrSpec[];
  generateChunk(ctx: ChunkGenCtx): ChunkValue;
}

export interface StandardNodeTypeDef extends Omit<NodeTypeDef, 'params'> {
  params: Record<string, KnobParamSpec>;
}

export function outputKindOf(def: NodeTypeDef, params: Record<string, ParamValue>): ValueKind {
  return typeof def.output === 'function' ? def.output(params) : def.output;
}

export function outputSemanticOf(
  def: NodeTypeDef,
  params: Record<string, ParamValue>,
): FieldSemantic | undefined {
  return typeof def.outputSemantic === 'function' ? def.outputSemantic(params) : def.outputSemantic;
}

export function paramIsVisible(spec: ParamSpec, params: Record<string, ParamValue>): boolean {
  return !spec.visibleWhen || params[spec.visibleWhen.param] === spec.visibleWhen.equals;
}

export function defaultParamValue(spec: ParamSpec): ParamValue {
  return spec.kind === 'tile' ? -1 : spec.default;
}

export function defaultParams(def: NodeTypeDef): Record<string, ParamValue> {
  const params: Record<string, ParamValue> = {};
  for (const [name, spec] of Object.entries(def.params)) params[name] = defaultParamValue(spec);
  return params;
}
