import { NO_ITEMS } from '@/features/asset-library/items/itemAssets';
import { emptyPipeline, type NodeInstance } from '@/features/asset-library/worlds/pipeline/pipelineState';
import { PipelineStore } from '@/features/asset-library/worlds/pipeline/pipelineStore';
import type { MineSlots } from '../worldRules';
import { WorldRulesSet, mineSlotsOf, stepRulesOf, type RulesTerrain } from '../worldRulesSet';
import type { StepRules } from '../sim/stepIsAllowed';

export const FLAT_GROUND: RulesTerrain = { tileIsWalkable: () => true, elevationAt: () => 0 };

export function nodeOfType(type: string, id = type): NodeInstance {
  return {
    id,
    type,
    label: type,
    comment: '',
    folder: '',
    enabled: true,
    params: {},
    inputs: {},
    display: { mode: 'hidden' },
  };
}

export function storeWithNodes(...nodes: NodeInstance[]): PipelineStore {
  return new PipelineStore({ ...emptyPipeline(), nodes });
}

export function rulesOn(terrain: RulesTerrain, store: PipelineStore = storeWithNodes()): WorldRulesSet {
  const rules = new WorldRulesSet(terrain);
  rules.attach(store, { items: NO_ITEMS, builtValueOf: () => null });
  return rules;
}

export function freshMine(rules: WorldRulesSet): MineSlots {
  return mineSlotsOf(new Map(), rules);
}

export function stepRulesOn(terrain: RulesTerrain, store?: PipelineStore): StepRules {
  const rules = rulesOn(terrain, store);
  return stepRulesOf(rules, freshMine(rules));
}
