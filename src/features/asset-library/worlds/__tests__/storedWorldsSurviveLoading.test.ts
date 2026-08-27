import { readFileSync } from 'node:fs';
import '../nodes';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { examplePipelines } from '../presets/examplePipelines';
import type { NodeInstance, PipelineState } from '../pipeline/pipelineState';
import { sanitizePipeline } from '../pipeline/sanitizePipeline';
import type { PipelineAliases } from '../pipeline/typeAliases';

interface StoredWorld {
  name: string;
  state: { nodes: { type: string; inputs?: Record<string, string | null> }[] };
}

function storedWorlds(): StoredWorld[] {
  return JSON.parse(readFileSync('data/worldPresets.json', 'utf8')) as StoredWorld[];
}

function shippedWorlds(): StoredWorld[] {
  return examplePipelines().map((preset) => ({
    name: preset.name,
    state: preset.state as StoredWorld['state'],
  }));
}

function wiresIn(nodes: readonly { inputs?: Record<string, string | null> }[]): number {
  return nodes.reduce((sum, node) => sum + Object.values(node.inputs ?? {}).filter(Boolean).length, 0);
}

function loadedWires(state: PipelineState): number {
  return wiresIn(state.nodes as readonly NodeInstance[]);
}

export function checkStoredWorldsSurviveLoading(check: CheckReporter): void {
  checkEveryStoredWorldLoadsWhole(check);
  checkAliasesCarryRenamesForward(check);
}

function checkEveryStoredWorldLoadsWhole(check: CheckReporter): void {
  const worlds = [...storedWorlds(), ...shippedWorlds()];
  const whole = worlds.filter((world) => {
    const loaded = sanitizePipeline(world.state);
    return (
      loaded.nodes.length === world.state.nodes.length &&
      loadedWires(loaded) === wiresIn(world.state.nodes)
    );
  });
  check(
    `every stored world loads with all of its nodes and wires (${worlds.length} worlds, ` +
      `${worlds.reduce((sum, world) => sum + world.state.nodes.length, 0)} nodes, ` +
      `${worlds.reduce((sum, world) => sum + wiresIn(world.state.nodes), 0)} wires)`,
    whole.length === worlds.length,
  );
  check(
    'the stored worlds are a real corpus rather than an empty folder nothing can regress in',
    worlds.length >= 18 && worlds.every((world) => world.state.nodes.length > 0),
  );
}

const RENAMED: PipelineAliases = {
  nodeTypes: { wobbleField: 'noiseField' },
  params: { noiseField: { zoom: 'scale' } },
};

function checkAliasesCarryRenamesForward(check: CheckReporter): void {
  const loaded = sanitizePipeline(
    {
      seed: 3,
      nodes: [
        { id: 'n1', type: 'wobbleField', label: 'old noise', params: { zoom: 0.03 }, inputs: {} },
        { id: 'n2', type: 'thresholdTiles', params: {}, inputs: { source: 'n1' } },
      ],
    },
    RENAMED,
  );
  check(
    'a world saved under an old node type name still loads as the node it was renamed to',
    loaded.nodes.length === 2 && loaded.nodes[0]!.type === 'noiseField',
  );
  check(
    'a param saved under its old name still lands on the param it was renamed to',
    loaded.nodes[0]!.params.scale === 0.03,
  );
  check(
    'wires into an aliased node survive the rename',
    loaded.nodes[1]!.inputs.source === 'n1',
  );
  const unknown = sanitizePipeline(
    { seed: 3, nodes: [{ id: 'n1', type: 'doesNotExist', params: {}, inputs: {} }] },
    RENAMED,
  );
  check('a node type no alias explains is still dropped', unknown.nodes.length === 0);
}
