import type { NodeInstance } from '../../procgen/pipeline/pipelineState';
import { NodeCommentRow } from './NodeCommentRow';
import { NodeFolderRow } from './NodeFolderRow';

/** Comment and folder are bookkeeping, not generation — empty ones stay out of sight. */
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
