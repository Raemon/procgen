import '../nodes';
import { computeNodeSignatures } from '../pipeline/nodeSignatures';
import { nodeTypeOf } from '../nodeRegistry';
import type { PipelineState } from '../pipeline/pipelineState';
import { sanitizePipeline } from '../pipeline/sanitizePipeline';
import { nodeFolderRuns } from '@/features/asset-library/detail/worldSeeds/nodeFolderRuns';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';

export function checkNodeFolders(check: CheckReporter): void {
  const foldedState = sanitizePipeline({
    seed: 3,
    nodes: [
      { id: 'a', type: 'terrainNoise', folder: 'terrain', params: {}, inputs: {} },
      { id: 'b', type: 'slopeField', folder: 'terrain', params: {}, inputs: { source: 'a' } },
      { id: 'c', type: 'coastDistance', folder: '', params: {}, inputs: { elevation: 'a' } },
      { id: 'd', type: 'terrainNoise', folder: 'terrain', params: {}, inputs: {} },
    ],
  });
  const runs = nodeFolderRuns(foldedState.nodes);
  check(
    'adjacent nodes sharing a folder fold into one run, and a break starts a new one',
    runs.length === 3 && runs[0]!.nodes.length === 2 && runs[1]!.folder === '' && runs[2]!.startIndex === 3,
  );
  check(
    'folders survive sanitize and serialization',
    sanitizePipeline(JSON.parse(JSON.stringify(foldedState))).nodes.map((node) => node.folder).join() ===
      'terrain,terrain,,terrain',
  );
  check(
    'folders never reach the node signature, so grouping cannot change the world',
    [...computeNodeSignatures(foldedState, nodeTypeReadsTime).values()].join() ===
      [...computeNodeSignatures(renamedFolders(foldedState), nodeTypeReadsTime).values()].join(),
  );
}

function renamedFolders(state: PipelineState): PipelineState {
  const nodes = state.nodes.map((node) => ({ ...node, folder: 'renamed' }));
  return sanitizePipeline({ ...state, nodes });
}

function nodeTypeReadsTime(nodeType: string): boolean {
  return nodeTypeOf(nodeType)?.readsTime === true;
}
