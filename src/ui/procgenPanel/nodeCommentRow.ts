import type { NodeInstance } from '../../procgen/pipeline/pipelineState';
import type { PipelineStore } from '../../procgen/pipeline/pipelineStore';

export function nodeCommentRow(store: PipelineStore, node: NodeInstance): HTMLElement {
  const textarea = document.createElement('textarea');
  textarea.className = 'node-comment';
  textarea.placeholder = 'notes — why is this node set up this way?';
  textarea.rows = 1;
  textarea.value = node.comment;
  requestAnimationFrame(() => fitHeightToContent(textarea));
  textarea.addEventListener('input', () => fitHeightToContent(textarea));
  textarea.addEventListener('change', () => store.setComment(node.id, textarea.value));
  return textarea;
}

function fitHeightToContent(textarea: HTMLTextAreaElement): void {
  textarea.style.height = 'auto';
  textarea.style.height = `${textarea.scrollHeight}px`;
}
