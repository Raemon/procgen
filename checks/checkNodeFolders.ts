import '../procgen/nodes';
import { computeNodeSignatures } from '../procgen/pipeline/nodeSignatures';
import { sanitizePipeline } from '../procgen/pipeline/sanitizePipeline';
import { nodeFolderRuns } from '../procgen/panel/nodeFolderRuns';
import type { CheckReporter } from './checkReporter';

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
    [...computeNodeSignatures(foldedState).values()].join() ===
      [...computeNodeSignatures(sanitizePipeline({ seed: 3, nodes: foldedState.nodes.map((node) => ({ ...node, folder: 'renamed' })) })).values()].join(),
  );
}
