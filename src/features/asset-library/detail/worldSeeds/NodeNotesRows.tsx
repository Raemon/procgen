import type { NodeInstance } from '@/features/asset-library/worlds/pipeline/pipelineState';
import { NodeCommentRow } from './NodeCommentRow';
import { NodeFolderRow } from './NodeFolderRow';

export function NodeNotesRows({ node }: { node: NodeInstance }) {
  return (
    <div className={annotated(node) ? undefined : 'hidden group-hover/row:block group-focus-within/row:block'}>
      <NodeCommentRow node={node} />
      <NodeFolderRow node={node} />
    </div>
  );
}

function annotated(node: NodeInstance): boolean {
  return node.comment.trim() !== '' || node.folder.trim() !== '';
}
