import { useState, type KeyboardEvent } from 'react';
import type { ParamSpec, ParamValue } from '../nodeType';
import { Button } from '../../frontend/controls/Button';
import { tooltipHandlers } from '../../frontend/tooltips/tooltipHandlers';
import { paramTooltip } from './help/paramTooltip';

export function CodeParam({
  spec,
  value,
  onChange,
}: {
  spec: ParamSpec;
  value: string;
  onChange(value: ParamValue): void;
}) {
  const [draft, setDraft] = useState(value);
  const applyCode = () => draft !== value && onChange(draft);
  return (
    <div className="mb-2">
      <textarea
        rows={10}
        spellCheck={false}
        className="w-full resize-y rounded border border-panel-edge bg-bg p-1.5 text-[11px] leading-relaxed whitespace-pre text-ink"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={applyCode}
        onKeyDown={(event) => applyOnCommandEnter(event, applyCode)}
      />
      <Button className="mt-1 w-full" onClick={applyCode} {...tooltipHandlers(paramTooltip(spec))}>
        apply code
      </Button>
    </div>
  );
}

function applyOnCommandEnter(event: KeyboardEvent, applyCode: () => void): void {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') applyCode();
}
