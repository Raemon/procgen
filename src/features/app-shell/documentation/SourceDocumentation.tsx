import { SourceExplorer } from './SourceExplorer';
import { buildSourceTree } from './sourceCatalog';

export function SourceDocumentation() {
  if (process.env.NODE_ENV !== 'development') return null;
  const root = buildSourceTree();
  return (
    <section className="mx-auto mt-10 max-w-[96rem]" aria-labelledby="source-heading">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="source-heading" className="text-lg text-accent">
            Source
          </h2>
          <p className="mt-1 text-sm text-ink-dim">
            Browse the executable code in this working tree, from folders to file-level functions and variables.
          </p>
        </div>
        <span className="font-mono text-xs uppercase tracking-[0.18em] text-ink-dim">
          Development only
        </span>
      </div>
      <SourceExplorer root={root} />
    </section>
  );
}
