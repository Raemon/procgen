import { API_CONTRACTS } from '@/features/app-shell/api/apiContracts';

export default function ApiDocsPage() {
  return (
    <main className="min-h-full bg-bg p-6 text-ink">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-2 text-xl text-accent">Procgen API</h1>
        <p className="mb-5 text-sm text-ink-dim">
          The same HTTP and WebSocket interface is used by the editor, agents, and external clients.{' '}
          <a className="text-accent underline" href="/api/v1/openapi.json">
            OpenAPI JSON
          </a>
        </p>
        <div className="overflow-hidden rounded border border-panel-edge">
          {API_CONTRACTS.map((contract) => (
            <div
              key={`${contract.method}-${contract.path}`}
              className="grid grid-cols-[5rem_1fr_2fr] gap-3 border-b border-panel-edge px-3 py-2 text-sm last:border-b-0"
            >
              <span className="text-accent">{contract.method}</span>
              <code>/api/v1{contract.path}</code>
              <span className="text-ink-dim">{contract.summary}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
