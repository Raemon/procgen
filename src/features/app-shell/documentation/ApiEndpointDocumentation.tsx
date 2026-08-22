import { buildApiEndpointCatalog } from './apiEndpointCatalog';
import { apiMethodColumns, displayApiPath, groupApiEndpoints, type ApiEndpointGroup } from './apiEndpointGroups';
import { ApiPathOperations } from './ApiPathOperations';

export function ApiEndpointDocumentation() {
  const endpoints = buildApiEndpointCatalog();
  const groups = groupApiEndpoints(endpoints);
  const methods = apiMethodColumns(endpoints);
  const rows = flattenGroups(groups);
  const httpCount = endpoints.filter((endpoint) => endpoint.transport === 'http').length;
  const socketCount = endpoints.length - httpCount;

  return (
    <section aria-labelledby="api-heading" className="min-w-0">
      <div className="mb-3 max-w-[22rem] border-b border-panel-edge pb-3">
        <p className="mb-1 text-[10px] uppercase tracking-[0.18em] text-ink-dim">Derived from the working tree</p>
        <h1 id="api-heading" className="text-xl text-accent">Server boundary</h1>
        <p className="mt-1 text-xs leading-5 text-ink-dim">
          URL layers, the code each operation reaches, and the in-repo callers that make it matter to a person.
        </p>
        <p className="mt-2 font-mono text-[11px] text-ink-dim">
          {httpCount} HTTP{socketCount > 0 ? ` · ${socketCount} WebSocket` : ''}
        </p>
      </div>
      <div className="max-h-[70vh] w-fit max-w-full overflow-auto rounded border border-panel-edge bg-panel">
        <table className="table-auto border-collapse">
          <caption className="sr-only">API endpoints grouped by URL layer</caption>
          <colgroup>
            <col />
            {methods.map((method) => <col key={method} className="w-px" />)}
          </colgroup>
          <thead className="sr-only">
            <tr>
              <th scope="col">URL</th>
              {methods.map((method) => <th key={method} scope="col">{method}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ group, depth }) => group.endpoints.length > 0 ? (
              <ApiPathOperations key={group.path} path={group.path} endpoints={group.endpoints} methods={methods} depth={depth} />
            ) : (
              <PathLayerRow key={group.path} group={group} methods={methods} depth={depth} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PathLayerRow({
  group,
  methods,
  depth,
}: {
  group: ApiEndpointGroup;
  methods: string[];
  depth: number;
}) {
  return (
    <tr className="border-b border-panel-edge/70 bg-bg/20 text-ink-dim last:border-b-0">
      <th scope="row" className="h-7 whitespace-nowrap py-0 pl-2 pr-2.5 text-left font-normal">
        <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 12}px` }}>
          <span className="text-[10px]" aria-hidden="true">{depth === 0 ? '/' : '↳'}</span>
          <code className="text-[11px]">{displayApiPath(group.path)}</code>
        </div>
      </th>
      {methods.map((method) => <td key={method} />)}
    </tr>
  );
}

function flattenGroups(
  groups: ApiEndpointGroup[],
  depth: number = 0,
): Array<{ group: ApiEndpointGroup; depth: number }> {
  return groups.flatMap((group) => [
    { group, depth },
    ...flattenGroups(group.children, depth + 1),
  ]);
}
