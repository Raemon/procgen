import { useLayoutEffect, useRef, useState } from 'react';
import { useAppRuntime } from '../../../../app/appRuntimeContext';
import type { NodeInstance } from '../../../../procgen/pipeline/pipelineState';

export function NodeCommentRow({ node }: { node: NodeInstance }) {
  const { store } = useAppRuntime();
  const textarea = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState(node.comment);
  useLayoutEffect(() => fitHeightToContent(textarea.current), [draft]);
  return (
    <textarea
      ref={textarea}
      rows={1}
      placeholder="notes — why is this node set up this way?"
      className="mb-2 block w-full resize-none overflow-hidden rounded border border-transparent bg-transparent px-1 py-[3px] text-[11px] leading-relaxed text-ink-dim italic placeholder:text-[#4a5568] hover:border-panel-edge hover:bg-bg hover:text-ink focus:border-panel-edge focus:bg-bg focus:text-ink"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => store.setComment(node.id, draft)}
    />
  );
}

function fitHeightToContent(textarea: HTMLTextAreaElement | null): void {
  if (!textarea) return;
  textarea.style.height = 'auto';
  textarea.style.height = `${textarea.scrollHeight}px`;
}
