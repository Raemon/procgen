import { everyRegisteredRoute } from '../api/agent/everyRoute';
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
    'the route and ability registries are populated here, so these checks cannot pass by finding nothing',
    everyRegisteredRoute().length >= 15 && everyAbility().length >= 50,
  );

  check(
    'every route an agent can call is described in the openapi document',
    everyRegisteredRoute().every((route) => document.paths[route.path]?.[route.method.toLowerCase()]),
  );

  const described = new Set(
    document.components.schemas.Action.oneOf.map((variant) => variant.properties.action.const),
  );
  check(
    'every ability reaches the openapi document, so a new one cannot ship undescribed',
    everyAbility().every((spec) => described.has(spec.action)),
  );
}
