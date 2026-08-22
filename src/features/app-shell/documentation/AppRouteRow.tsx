'use client';

import { HoverCardTrigger } from './HoverCard';
import type { AppRouteApiCall, AppRouteComponent } from './appRouteCatalog';

export function AppRouteComponentRow({
  component,
  depth,
}: {
  component: AppRouteComponent;
  depth: number;
}) {
  return (
    <>
      <tr className="border-b border-panel-edge/70 last:border-b-0">
        <td className="h-7 whitespace-nowrap py-0 pl-2 pr-2 align-middle">
          <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 12}px` }}>
            <span className="text-[10px] text-ink-dim" aria-hidden="true">↳</span>
            <HoverCardTrigger
              label={`${component.file}:${component.line}`}
              card={<ComponentCard component={component} />}
              className="min-w-0"
            >
              <code className="truncate text-[11px] text-ink">{component.name}</code>
            </HoverCardTrigger>
          </div>
        </td>
        <td className="h-7 whitespace-nowrap py-0 pl-3 pr-2 align-middle">
          <div className="flex flex-wrap items-center gap-x-2">
            {component.calls.map((call) => <CallChip key={callKey(call)} call={call} />)}
          </div>
        </td>
      </tr>
      {component.children.map((child) => (
        <AppRouteComponentRow key={`${child.file}:${child.name}`} component={child} depth={depth + 1} />
      ))}
    </>
  );
}

function CallChip({ call }: { call: AppRouteApiCall }) {
  return (
    <span className="font-mono text-[10px] leading-4 text-ink-dim">
      <span className="text-accent opacity-70">{call.method}</span> {shortPath(call.path)}
    </span>
  );
}

function ComponentCard({ component }: { component: AppRouteComponent }) {
  return (
    <>
      <p className="mb-1 text-[9px] uppercase tracking-[0.14em] text-ink-dim">
        {component.children.length} rendered {component.children.length === 1 ? 'child' : 'children'}
      </p>
      {component.calls.length === 0 ? (
        <p className="font-mono text-[10px] leading-4 text-ink-dim">calls no API</p>
      ) : (
        component.calls.map((call) => (
          <div key={callKey(call)} className="font-mono text-[10px] leading-4 text-ink">
            <span className="text-accent opacity-80">{call.method}</span> {call.path}
            <span className="ml-1.5 text-ink-dim">via {call.through}</span>
          </div>
        ))
      )}
    </>
  );
}

function shortPath(path: string): string {
  return path.replace(/^\/api\/v1/, '').replace(/^\/api/, '');
}

function callKey(call: AppRouteApiCall): string {
  return `${call.method} ${call.path}`;
}
