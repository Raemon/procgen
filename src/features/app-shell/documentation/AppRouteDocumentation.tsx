import { AppRouteComponentRow } from './AppRouteRow';
import { buildAppRouteCatalog, type AppRouteComponent } from './appRouteCatalog';

export function AppRouteDocumentation() {
  const routes = buildAppRouteCatalog();
  const componentCount = routes.reduce((total, route) => total + route.components.reduce(countComponents, 0), 0);

  return (
    <section aria-labelledby="routes-heading" className="min-w-0">
      <div className="mb-3 max-w-[22rem] border-b border-panel-edge pb-3">
        <p className="mb-1 text-[10px] uppercase tracking-[0.18em] text-ink-dim">Rendered from src/app</p>
        <h2 id="routes-heading" className="text-xl text-accent">Browser surface</h2>
        <p className="mt-1 text-xs leading-5 text-ink-dim">
          Each URL a person can open, the components it nests, and the API calls those components make.
        </p>
        <p className="mt-2 font-mono text-[11px] text-ink-dim">
          {routes.length} routes · {componentCount} components
        </p>
      </div>
      <div className="max-h-[70vh] w-fit max-w-[38rem] overflow-auto rounded border border-panel-edge bg-panel">
        <table className="table-auto border-collapse">
          <caption className="sr-only">URL routes, their nested components, and the API calls those components make</caption>
          <thead className="sr-only">
            <tr>
              <th scope="col">Component</th>
              <th scope="col">API calls</th>
            </tr>
          </thead>
          <tbody>
            {routes.map((route) => (
              <RouteRows key={`${route.path}:${route.file}`} path={route.path} components={route.components} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RouteRows({ path, components }: { path: string; components: AppRouteComponent[] }) {
  return (
    <>
      <tr className="border-b border-panel-edge/70 bg-btn/18">
        <th scope="row" className="h-7 whitespace-nowrap py-0 pl-2 pr-2.5 text-left font-normal">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-ink-dim" aria-hidden="true">/</span>
            <code className="text-[11px] text-ink">{path}</code>
          </div>
        </th>
        <td />
      </tr>
      {components.map((component) => (
        <AppRouteComponentRow key={`${component.file}:${component.name}`} component={component} depth={1} />
      ))}
    </>
  );
}

function countComponents(total: number, component: AppRouteComponent): number {
  return component.children.reduce(countComponents, total + 1);
}
