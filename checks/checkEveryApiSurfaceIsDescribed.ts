import { allRoutes } from '../api/agent/routeRegistry';
import { openApiDocument } from '../api/docs/openApiDocument';
import { everyAbility } from '../api/docs/apiDocs';

export function checkEveryApiSurfaceIsDescribed(
  check: (name: string, condition: boolean) => void,
): void {
  const document = openApiDocument() as {
    paths: Record<string, Record<string, unknown>>;
    components: { schemas: { Action: { oneOf: { properties: { action: { const: string } } }[] } } };
  };

  check(
    'every route an agent can call is described in the openapi document',
    allRoutes().every((route) => document.paths[route.path]?.[route.method.toLowerCase()]),
  );

  const described = new Set(
    document.components.schemas.Action.oneOf.map((variant) => variant.properties.action.const),
  );
  check(
    'every ability reaches the openapi document, so a new one cannot ship undescribed',
    everyAbility().every((spec) => described.has(spec.action)),
  );
}
