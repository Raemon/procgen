import type { NodeInstance } from '@/features/asset-library/worlds/pipeline/pipelineState';
import { NodeCommentRow } from './NodeCommentRow';

export function NodeNotesRows({ node }: { node: NodeInstance }) {
  return (
    <div className={node.comment.trim() === '' ? 'hidden group-hover/row:block group-focus-within/row:block' : undefined}>
      <NodeCommentRow node={node} />
    </div>
  );
}
