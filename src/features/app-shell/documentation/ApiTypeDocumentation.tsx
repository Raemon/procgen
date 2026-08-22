import { ApiTypeRow } from './ApiTypeRow';
import { buildApiTypeCatalog } from './apiTypeCatalog';

export function ApiTypeDocumentation() {
  const entries = buildApiTypeCatalog();
  const reached = entries.filter((entry) => entry.reachedByApi).length;

  return (
    <section aria-labelledby="types-heading" className="min-w-0">
      <div className="mb-3 max-w-[22rem] border-b border-panel-edge pb-3">
        <p className="mb-1 text-[10px] uppercase tracking-[0.18em] text-ink-dim">Declared in the working tree</p>
        <h2 id="types-heading" className="text-xl text-accent">Vocabulary</h2>
        <p className="mt-1 text-xs leading-5 text-ink-dim">
          Every type this codebase invents, ordered by when the server boundary first needs it.
        </p>
        <p className="mt-2 font-mono text-[11px] text-ink-dim">
          {reached} on the API path · {entries.length} total
        </p>
      </div>
      <div className="max-h-[70vh] w-fit max-w-full overflow-auto rounded border border-panel-edge bg-panel">
        <table className="table-auto border-collapse">
          <caption className="sr-only">Types and interfaces declared in this codebase</caption>
          <thead className="sr-only">
            <tr>
              <th scope="col">Kind</th>
              <th scope="col">Name</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <ApiTypeRow key={`${entry.file}:${entry.line}:${entry.name}`} entry={entry} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
