'use client';

import { ApiCallTreeTrigger, type ApiCallTreeRoot } from './ApiCallTreeTooltip';
import { displayApiPath } from './apiEndpointGroups';
import type { ApiEndpoint } from './apiEndpointTypes';

export function ApiPathOperations({
  path,
  endpoints,
  methods,
  depth,
}: {
  path: string;
  endpoints: ApiEndpoint[];
  methods: string[];
  depth: number;
}) {
  const roots = endpoints.map(callTreeRoot);
  return (
    <tr className="border-b border-panel-edge/70 bg-btn/18 last:border-b-0">
      <th scope="row" className="h-7 whitespace-nowrap py-0 pl-2 pr-2.5 text-left font-normal">
        <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 12}px` }}>
          <span className="text-[10px] text-ink-dim" aria-hidden="true">{depth === 0 ? '/' : '↳'}</span>
          <ApiCallTreeTrigger label={path} roots={roots} className="min-w-0">
            <code className="truncate text-[11px] text-ink">{displayApiPath(path)}</code>
          </ApiCallTreeTrigger>
        </div>
      </th>
      {methods.map((method, index) => {
        const endpoint = endpoints.find((candidate) => candidate.method === method);
        const spacing = index === 0 ? 'pl-2.5 pr-1' : 'px-1';
        return (
          <td key={method} className={`h-7 whitespace-nowrap py-0 text-left align-middle ${spacing}`}>
            {endpoint ? (
              <ApiCallTreeTrigger
                label={`${endpoint.method} ${endpoint.path}`}
                roots={[callTreeRoot(endpoint)]}
              >
                <span className="flex h-5 items-center text-[9px] tracking-[0.08em] text-ink opacity-50">
                  {method}
                </span>
              </ApiCallTreeTrigger>
            ) : (
              <span aria-hidden="true" className="flex h-5 items-center text-[9px] tracking-[0.08em] text-ink opacity-[0.1]">
                {method}
              </span>
            )}
          </td>
        );
      })}
    </tr>
  );
}

function callTreeRoot(endpoint: ApiEndpoint): ApiCallTreeRoot {
  return {
    label: endpoint.method,
    step: endpoint.code,
    consumers: endpoint.consumers,
    signature: endpoint.signature,
  };
}
