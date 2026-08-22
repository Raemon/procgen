'use client';

import { HoverCardTrigger } from './HoverCard';
import type { ApiTypeEntry } from './apiTypeCatalog';

const KIND_MARK: Readonly<Record<ApiTypeEntry['kind'], string>> = {
  interface: 'I',
  type: 'T',
  enum: 'E',
};

export function ApiTypeRow({ entry }: { entry: ApiTypeEntry }) {
  return (
    <tr className="border-b border-panel-edge/70 last:border-b-0">
      <td className="h-7 w-px py-0 pl-2 pr-1 align-middle">
        <span
          className={`text-[9px] tracking-[0.08em] ${entry.reachedByApi ? 'text-accent opacity-70' : 'text-ink opacity-30'}`}
          title={entry.kind}
        >
          {KIND_MARK[entry.kind]}
        </span>
      </td>
      <td className="h-7 whitespace-nowrap py-0 pl-1.5 pr-2 align-middle">
        <HoverCardTrigger label={`${entry.file}:${entry.line}`} card={<TypeCard entry={entry} />} className="min-w-0">
          <code className={`truncate text-[11px] ${entry.reachedByApi ? 'text-ink' : 'text-ink-dim'}`}>
            {entry.name}
          </code>
        </HoverCardTrigger>
      </td>
    </tr>
  );
}

function TypeCard({ entry }: { entry: ApiTypeEntry }) {
  return (
    <>
      <p className="mb-1 text-[9px] uppercase tracking-[0.14em] text-ink-dim">
        {entry.kind}{entry.exported ? ' · exported' : ' · module-private'}
        {entry.reachedByApi ? ' · on the API path' : ''}
      </p>
      <pre className="whitespace-pre font-mono text-[10px] leading-4 text-ink">{entry.excerpt}</pre>
    </>
  );
}
