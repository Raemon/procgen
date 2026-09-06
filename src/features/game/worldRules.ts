import type { ItemSource } from '@/features/asset-library/items/itemAssets';
import { NO_ITEM_SPAWNS, type ItemSpawnSource } from '@/features/asset-library/items/pickups/itemSpawnSource';
import type { NodeInstance } from '@/features/asset-library/worlds/pipeline/pipelineState';
import type { Marker } from '@/features/asset-library/worlds/worldSampler';
import type { ReadOnlyPipelineStore } from '@/features/app-shell/runtime/readOnlyAssets';
import type { Circuit } from './circuits/circuit';
import { navigationLevelOf } from './climbing';
import type { KeyPurse } from './fixtures/keyPurse';
import { nothingToUse, type UseOutcome } from './fixtures/useOutcome';

export interface Cell {
  x: number;
  y: number;
}

export interface StepAttempt {
  from: Cell;
  to: Cell;
  dx: number;
  dy: number;
  mayPush: boolean;
  commit: boolean;
}

export type StepVerdict = { allowed: true } | { allowed: false; why: string };

export const STEP_ALLOWED: StepVerdict = { allowed: true };

export function stepRefused(why: string): StepVerdict {
  return { allowed: false, why };
}

export function climbRefusal(
  surfaceAt: (x: number, y: number) => number,
  from: Cell,
  to: Cell,
  limit: number,
  effort: string,
): string | null {
  const fromLevel = navigationLevelOf(surfaceAt(from.x, from.y));
  const toLevel = navigationLevelOf(surfaceAt(to.x, to.y));
  if (toLevel - fromLevel <= limit) return null;
  return `the ground at (${to.x},${to.y}) is level ${toLevel}, ${toLevel - fromLevel} above your level ${fromLevel}; ${effort} climbs at most ${limit} level`;
}

export function obstacleRefusal(to: Cell): string {
  return `something solid at (${to.x},${to.y}) is in the way`;
}

export interface JumpAttempt {
  from: Cell;
  dx: number;
  dy: number;
}

export interface MineSlots {
  get(nodeId: string): unknown;
  set(nodeId: string, value: unknown): void;
}

export interface DefaultRules {
  step(attempt: StepAttempt): StepVerdict;
  jump(attempt: JumpAttempt): Cell | null;
  surfaceAt(x: number, y: number): number;
  tileIsWalkable(x: number, y: number): boolean;
  climbGate(from: Cell, to: Cell, limit: number): boolean;
}

export interface WorldRules {
  readonly nodeId: string;
  readonly nodeType: string;
  owns(x: number, y: number): boolean;
  initialMine(): unknown;
  spawn(): Cell | null;
  surfaceRiseAt(x: number, y: number): number;
  blocksAt(x: number, y: number): boolean;
  step(attempt: StepAttempt, mine: MineSlots, defaults: DefaultRules): StepVerdict;
  jump(attempt: JumpAttempt, mine: MineSlots, defaults: DefaultRules): Cell | null;
  markersIn(minX: number, minY: number, maxX: number, maxY: number): Marker[];
  circuitsIn(minX: number, minY: number, maxX: number, maxY: number): Circuit[];
  cratesIn(minX: number, minY: number, maxX: number, maxY: number): Cell[];
  actionAt(x: number, y: number): string | null;
  use(x: number, y: number, mine: MineSlots, purse: KeyPurse): UseOutcome;
  resetRoomAt(x: number, y: number): string | null;
  resetGrowsAFreshWorld(): boolean;
  readonly items: ItemSpawnSource;
  revision(): number;
  snapshot(): unknown;
  applySnapshot(raw: unknown): void;
}

export interface AttachContext {
  store: ReadOnlyPipelineStore;
  node: NodeInstance;
  tileIsWalkable(x: number, y: number): boolean;
  elevationAt(x: number, y: number): number;
  items: ItemSource;
  builtValue(): unknown | null;
}

export interface RulesOverlayFactory {
  nodeType: string;
  attach(context: AttachContext): WorldRules;
  describe?(state: unknown): string;
}

const factories = new Map<string, RulesOverlayFactory>();

export function registerWorldRules(factory: RulesOverlayFactory): RulesOverlayFactory {
  factories.set(factory.nodeType, factory);
  return factory;
}

export function worldRulesFor(nodeType: string): RulesOverlayFactory | undefined {
  return factories.get(nodeType);
}

export function registeredWorldRules(): RulesOverlayFactory[] {
  return [...factories.values()];
}

export function inertRules(nodeId: string, nodeType: string): WorldRules {
  return {
    nodeId,
    nodeType,
    owns: () => false,
    initialMine: () => null,
    spawn: () => null,
    surfaceRiseAt: () => 0,
    blocksAt: () => false,
    step: (attempt, _mine, defaults) => defaults.step(attempt),
    jump: (attempt, _mine, defaults) => defaults.jump(attempt),
    markersIn: () => [],
    circuitsIn: () => [],
    cratesIn: () => [],
    actionAt: () => null,
    use: (x, y) => nothingToUse(x, y),
    resetRoomAt: () => null,
    resetGrowsAFreshWorld: () => false,
    items: NO_ITEM_SPAWNS,
    revision: () => 0,
    snapshot: () => null,
    applySnapshot: () => undefined,
  };
}

export function rulesWithDefaults(
  base: Pick<WorldRules, 'nodeId' | 'nodeType'> & Partial<WorldRules>,
): WorldRules {
  return { ...inertRules(base.nodeId, base.nodeType), ...base };
}
