import type { ItemSource } from '@/features/asset-library/items/itemAssets';
import type { ItemSpawnSource } from '@/features/asset-library/items/pickups/itemSpawnSource';
import type { ReadOnlyPipelineStore } from '@/features/app-shell/runtime/readOnlyAssets';
import type { NodeInstance } from '@/features/asset-library/worlds/pipeline/pipelineState';
import type { Marker } from '@/features/asset-library/worlds/worldSampler';
import type { Circuit } from './circuits/circuit';
import { wireMarkersOf } from './circuits/wireMarkers';
import {
  JUMP_CLIMB_LIMIT,
  WALK_CLIMB_LIMIT,
  navigationRiseBetween,
  standableProbeFrom,
} from './climbing';
import type { KeyPurse } from './fixtures/keyPurse';
import { nothingToUse, type UseOutcome } from './fixtures/useOutcome';
import { LANDING_DISTANCES } from './sim/jumpLanding';
import type { StepRules } from './sim/stepIsAllowed';
import {
  STEP_ALLOWED,
  climbRefusal,
  obstacleRefusal,
  stepRefused,
  worldRulesFor,
  type Cell,
  type DefaultRules,
  type JumpAttempt,
  type MineSlots,
  type RulesOverlayFactory,
  type StepAttempt,
  type StepVerdict,
  type WorldRules,
} from './worldRules';

export interface RulesTerrain {
  tileIsWalkable(x: number, y: number): boolean;
  elevationAt(x: number, y: number): number;
}

export interface AttachSources {
  items: ItemSource;
  builtValueOf(nodeId: string): unknown | null;
}

interface AttachedRules {
  rules: WorldRules;
  key: string;
}

export class WorldRulesSet {
  private overlays: WorldRules[] = [];
  private readonly attached = new Map<string, AttachedRules>();
  private lastAttach: { store: ReadOnlyPipelineStore; sources: AttachSources } | null = null;
  readonly defaults: DefaultRules;
  readonly items: ItemSpawnSource;

  constructor(private readonly terrain: RulesTerrain) {
    this.defaults = {
      step: (attempt) => this.defaultStep(attempt),
      jump: (attempt) => this.defaultJump(attempt),
      surfaceAt: (x, y) => this.surfaceAt(x, y),
      tileIsWalkable: (x, y) => terrain.tileIsWalkable(x, y),
      climbGate: (from, to, limit) => this.climbGate(from, to, limit),
    };
    this.items = {
      itemSpawnsIn: (minX, minY, maxX, maxY) =>
        this.overlays.flatMap((rules) => rules.items.itemSpawnsIn(minX, minY, maxX, maxY)),
      takeSpawn: (spawn) => this.overlays.some((rules) => rules.items.takeSpawn(spawn)),
    };
  }

  attach(store: ReadOnlyPipelineStore, sources: AttachSources): void {
    this.lastAttach = { store, sources };
    const seen = new Set<string>();
    this.overlays = [];
    for (const node of store.nodes()) {
      if (!node.enabled) continue;
      const factory = worldRulesFor(node.type);
      if (!factory) continue;
      const built = sources.builtValueOf(node.id) === null ? 'unbuilt' : 'built';
      const key = `${store.seed()}:${JSON.stringify(node)}:${built}`;
      const kept = this.attached.get(node.id);
      const rules =
        kept && kept.key === key ? kept.rules : this.buildRules(factory, store, node, sources, kept?.rules ?? null);
      this.attached.set(node.id, { rules, key });
      seen.add(node.id);
      this.overlays.push(rules);
    }
    for (const nodeId of [...this.attached.keys()]) if (!seen.has(nodeId)) this.attached.delete(nodeId);
  }

  private buildRules(
    factory: RulesOverlayFactory,
    store: ReadOnlyPipelineStore,
    node: NodeInstance,
    sources: AttachSources,
    before: WorldRules | null,
  ): WorldRules {
    const rules = factory.attach({
      store,
      node,
      tileIsWalkable: (x, y) => this.terrain.tileIsWalkable(x, y),
      elevationAt: (x, y) => this.terrain.elevationAt(x, y),
      items: sources.items,
      builtValue: () => sources.builtValueOf(node.id),
    });
    if (before && before.nodeType === node.type) rules.applySnapshot(before.snapshot());
    return rules;
  }

  followStore(store: ReadOnlyPipelineStore, sources: AttachSources): () => void {
    this.attach(store, sources);
    return store.onChange(() => this.attach(store, sources));
  }

  refresh(): void {
    if (this.lastAttach) this.attach(this.lastAttach.store, this.lastAttach.sources);
  }

  adoptStateOf(previous: WorldRulesSet): void {
    for (const rules of this.overlays) {
      const before = previous.overlays.find(
        (candidate) => candidate.nodeId === rules.nodeId && candidate.nodeType === rules.nodeType,
      );
      if (before) rules.applySnapshot(before.snapshot());
    }
  }

  all(): readonly WorldRules[] {
    return this.overlays;
  }

  find(nodeType: string): WorldRules | undefined {
    return this.overlays.find((rules) => rules.nodeType === nodeType);
  }

  byNodeId(nodeId: string): WorldRules | undefined {
    return this.overlays.find((rules) => rules.nodeId === nodeId);
  }

  owner(x: number, y: number): WorldRules | null {
    for (let index = this.overlays.length - 1; index >= 0; index--) {
      const rules = this.overlays[index]!;
      if (rules.owns(x, y)) return rules;
    }
    return null;
  }

  surfaceAt(x: number, y: number): number {
    let surface = this.terrain.elevationAt(x, y);
    for (const rules of this.overlays) surface += rules.surfaceRiseAt(x, y);
    return surface;
  }

  blocksAt(x: number, y: number): boolean {
    return this.overlays.some((rules) => rules.blocksAt(x, y));
  }

  isWalkable(x: number, y: number): boolean {
    return this.terrain.tileIsWalkable(x, y) && !this.blocksAt(x, y);
  }

  isStandable(x: number, y: number): boolean {
    const walkable = (px: number, py: number) => this.isWalkable(px, py);
    const gate = (fromX: number, fromY: number, toX: number, toY: number) =>
      this.climbGate({ x: fromX, y: fromY }, { x: toX, y: toY }, WALK_CLIMB_LIMIT);
    return standableProbeFrom(walkable, gate)(x, y);
  }

  climbGate(from: Cell, to: Cell, limit: number): boolean {
    return navigationRiseBetween(this.surfaceAt(from.x, from.y), this.surfaceAt(to.x, to.y)) <= limit;
  }

  step(mine: MineSlots, attempt: StepAttempt): StepVerdict {
    const owner = this.owner(attempt.to.x, attempt.to.y);
    return owner ? owner.step(attempt, mine, this.defaults) : this.defaults.step(attempt);
  }

  jump(mine: MineSlots, attempt: JumpAttempt): Cell | null {
    const owner = this.owner(attempt.from.x, attempt.from.y);
    return owner ? owner.jump(attempt, mine, this.defaults) : this.defaults.jump(attempt);
  }

  markersIn(minX: number, minY: number, maxX: number, maxY: number): Marker[] {
    return [
      ...wireMarkersOf(this.circuitsIn(minX, minY, maxX, maxY), minX, minY, maxX, maxY),
      ...this.overlays.flatMap((rules) => rules.markersIn(minX, minY, maxX, maxY)),
    ];
  }

  circuitsIn(minX: number, minY: number, maxX: number, maxY: number): Circuit[] {
    return this.overlays.flatMap((rules) => rules.circuitsIn(minX, minY, maxX, maxY));
  }

  cratesIn(minX: number, minY: number, maxX: number, maxY: number): Cell[] {
    return this.overlays.flatMap((rules) => rules.cratesIn(minX, minY, maxX, maxY));
  }

  actionAt(x: number, y: number): string | null {
    for (const rules of this.overlays) {
      const action = rules.actionAt(x, y);
      if (action) return action;
    }
    return null;
  }

  use(x: number, y: number, mine: MineSlots, purse: KeyPurse): UseOutcome {
    const owner = this.owner(x, y);
    return owner ? owner.use(x, y, mine, purse) : nothingToUse(x, y);
  }

  resetRoomAt(x: number, y: number): string | null {
    return this.owner(x, y)?.resetRoomAt(x, y) ?? null;
  }

  spawn(): Cell | null {
    for (const rules of this.overlays) {
      const spot = rules.spawn();
      if (spot) return spot;
    }
    return null;
  }

  revision(): number {
    return this.overlays.reduce((total, rules) => total + rules.revision(), 0);
  }

  snapshot(): Record<string, unknown> {
    const states: Record<string, unknown> = {};
    for (const rules of this.overlays) {
      const state = rules.snapshot();
      if (state !== null && state !== undefined) states[rules.nodeId] = state;
    }
    return states;
  }

  applySnapshot(states: Record<string, unknown>): void {
    for (const rules of this.overlays) {
      const own = states[rules.nodeId] ?? states[rules.nodeType];
      if (own !== undefined) rules.applySnapshot(own);
    }
  }

  forgetAll(): void {
    for (const rules of this.overlays) rules.applySnapshot(null);
  }

  private defaultStep(attempt: StepAttempt): StepVerdict {
    const { from, to } = attempt;
    const tooSteep = climbRefusal((x, y) => this.surfaceAt(x, y), from, to, WALK_CLIMB_LIMIT, 'a step');
    if (tooSteep) return stepRefused(tooSteep);
    if (!this.isWalkable(to.x, to.y)) return stepRefused(obstacleRefusal(to));
    return STEP_ALLOWED;
  }

  private defaultJump(attempt: JumpAttempt): Cell | null {
    for (const distance of LANDING_DISTANCES) {
      const to = { x: attempt.from.x + attempt.dx * distance, y: attempt.from.y + attempt.dy * distance };
      if (this.jumpLands(attempt.from, to, attempt.dx, attempt.dy, distance)) return to;
    }
    return null;
  }

  private jumpLands(from: Cell, to: Cell, dx: number, dy: number, distance: number): boolean {
    if (!this.climbGate(from, to, JUMP_CLIMB_LIMIT)) return false;
    for (let step = 1; step < distance; step++) {
      if (this.blocksAt(from.x + dx * step, from.y + dy * step)) return false;
    }
    return this.isWalkable(to.x, to.y);
  }
}

export function mineSlotsOf(held: Map<string, unknown>, rules: WorldRulesSet): MineSlots {
  return {
    get: (nodeId) => {
      if (!held.has(nodeId)) held.set(nodeId, rules.byNodeId(nodeId)?.initialMine() ?? null);
      return held.get(nodeId);
    },
    set: (nodeId, value) => held.set(nodeId, value),
  };
}

export function stepRulesOf(rules: WorldRulesSet, mine: MineSlots): StepRules {
  return {
    isWalkableAt: (x, y) => rules.isWalkable(x, y),
    isStandableAt: (x, y) => rules.isStandable(x, y),
    step: (from, to, dx, dy, mayPush, commit) => rules.step(mine, { from, to, dx, dy, mayPush, commit }),
    jump: (from, dx, dy) => rules.jump(mine, { from, dx, dy }),
  };
}
