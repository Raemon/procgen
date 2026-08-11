import type { NodeInstance } from '../pipeline/pipelineState';

export interface NodeRun {
  folder: string;
  startIndex: number;
  nodes: NodeInstance[];
}

export function nodeFolderRuns(nodes: readonly NodeInstance[]): NodeRun[] {
  const runs: NodeRun[] = [];
  nodes.forEach((node, index) => {
    const openRun = runs[runs.length - 1];
    if (openRun && continuesRun(openRun, node)) openRun.nodes.push(node);
    else runs.push({ folder: node.folder, startIndex: index, nodes: [node] });
  });
  return runs;
}

function continuesRun(run: NodeRun, node: NodeInstance): boolean {
  return run.folder === node.folder && node.folder !== '';
}

export function folderNamesIn(nodes: readonly NodeInstance[]): string[] {
  return [...new Set(nodes.map((node) => node.folder).filter((folder) => folder !== ''))];
}
