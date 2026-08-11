import '../nodes';
import { emptyPipeline } from '../pipeline/pipelineState';
import { PipelineStore } from '../pipeline/pipelineStore';
import { sanitizePipeline } from '../pipeline/sanitizePipeline';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { islandsState } from './pipelineWorldFixtures';

export function checkPipelineSanitizeAndEditing(check: CheckReporter): void {
  const roundtrip = sanitizePipeline(JSON.parse(JSON.stringify(islandsState())));
  check('pipeline serialization roundtrips', JSON.stringify(roundtrip) === JSON.stringify(islandsState()));
  check(
    'node comments survive sanitize and serialization',
    roundtrip.nodes.every((node, i) => node.comment === islandsState().nodes[i]!.comment),
  );

  const withUnknown = sanitizePipeline({
    seed: 1,
    nodes: [...(islandsState().nodes as unknown[]), { id: 'nx', type: 'doesNotExist', params: {} }],
  });
  check('unknown node types are dropped on load', withUnknown.nodes.length === 7);

  const forwardWire = sanitizePipeline({
    seed: 1,
    nodes: [
      { id: 'n1', type: 'thresholdTiles', params: {}, inputs: { source: 'n2' } },
      { id: 'n2', type: 'noiseField', params: {}, inputs: {} },
    ],
  });
  check('wires to later nodes are dropped', forwardWire.nodes[0]!.inputs.source === null);

  const editing = new PipelineStore(emptyPipeline());
  const noiseA = editing.addNode('noiseField')!;
  const noiseB = editing.addNode('noiseField')!;
  const thresholdNode = editing.addNode('thresholdTiles')!;
  check('a new node auto-wires to the nearest compatible source', thresholdNode.inputs.source === noiseB.id);
  const combineNode = editing.addNode('combineFields')!;
  check(
    'a new multi-input node fans out across the most recent distinct sources',
    combineNode.inputs.a === noiseB.id && combineNode.inputs.b === noiseA.id,
  );
  check('optional inputs stay unwired on creation', editing.addNode('scatterPoints')!.inputs.mask === null);

  const duplicated = editing.duplicateNode(thresholdNode.id)!;
  check(
    'duplicating copies params and wiring under a fresh id right after the original',
    duplicated.id !== thresholdNode.id &&
      duplicated.inputs.source === noiseB.id &&
      JSON.stringify(duplicated.params) === JSON.stringify(thresholdNode.params) &&
      editing.nodes()[3]!.id === duplicated.id,
  );

  editing.moveNodeToIndex(noiseB.id, editing.nodes().length);
  check('dragging a node to the end lands it there', editing.nodes()[editing.nodes().length - 1]!.id === noiseB.id);
  check(
    'dragging a source below its consumers unwires them but spares other wires',
    thresholdNode.inputs.source === null && combineNode.inputs.a === null && combineNode.inputs.b === noiseA.id,
  );
  editing.moveNodeToIndex(noiseB.id, 0);
  check('dragging a node to the top lands it there', editing.nodes()[0]!.id === noiseB.id);

  const healing = new PipelineStore(emptyPipeline());
  const baseNoise = healing.addNode('noiseField')!;
  const midCombine = healing.addNode('combineFields')!;
  const tailCombine = healing.addNode('combineFields')!;
  check(
    'with one source available every required input reuses it',
    midCombine.inputs.a === baseNoise.id && midCombine.inputs.b === baseNoise.id,
  );
  healing.removeNode(midCombine.id);
  check(
    'deleting a mid-chain node splices its consumers onto its own source',
    tailCombine.inputs.a === baseNoise.id && tailCombine.inputs.b === baseNoise.id,
  );
  healing.removeNode(baseNoise.id);
  check('deleting a node with no upstream leaves consumers unwired', tailCombine.inputs.a === null);
}
