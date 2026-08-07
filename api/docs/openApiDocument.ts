import '../../abilities/index';
import type { AbilityParamSpec, AbilitySpec } from '../../abilities/ability';
import { everyRegisteredRoute } from '../agent/everyRoute';
import type { RouteSpec } from '../agent/routeRegistry';
import { everyAbility } from './apiDocs';

export function openApiDocument(): object {
  return {
    openapi: '3.1.0',
    info: {
      title: 'Procgen world — agent API',
      version: '1',
      description:
        'Every ability in this application is one action of POST /agents/{id}/act. The human at the browser has no powers an agent lacks.',
    },
    servers: [{ url: '/api/v1' }],
    paths: Object.fromEntries(pathItems()),
    components: { schemas: { Action: actionSchema() } },
  };
}

function pathItems(): [string, object][] {
  const byPath = new Map<string, Record<string, object>>();
  for (const route of everyRegisteredRoute()) {
    const item = byPath.get(route.path) ?? {};
    item[route.method.toLowerCase()] = operationOf(route);
    byPath.set(route.path, item);
  }
  return [...byPath];
}

function operationOf(route: RouteSpec): object {
  return {
    summary: route.summary,
    operationId: operationIdOf(route),
    parameters: [...pathParametersOf(route), ...queryParametersOf(route)],
    ...requestBodyOf(route),
    responses: { '200': { description: route.summary } },
  };
}

function operationIdOf(route: RouteSpec): string {
  const words = route.path.replace(/[{}]/g, '').split(/[/-]/).filter(Boolean);
  return [route.method.toLowerCase(), ...words].join('_');
}

function pathParametersOf(route: RouteSpec): object[] {
  return [...route.path.matchAll(/\{(\w+)\}/g)].map(([, name]) => ({
    name,
    in: 'path',
    required: true,
    schema: { type: 'string' },
  }));
}

function queryParametersOf(route: RouteSpec): object[] {
  return Object.entries(route.query).map(([name, param]) => ({
    name,
    in: 'query',
    required: param.optional !== true,
    description: param.help,
    schema: schemaOf(param),
  }));
}

function requestBodyOf(route: RouteSpec): object {
  const entries = Object.entries(route.body);
  if (entries.length === 0) return {};
  return {
    requestBody: {
      required: true,
      content: { 'application/json': { schema: objectSchema(route.body) } },
    },
  };
}

function actionSchema(): object {
  return {
    description: 'One action per request. Every ability in the app is one of these.',
    oneOf: everyAbility().map(abilityVariant),
  };
}

function abilityVariant(spec: AbilitySpec): object {
  return {
    title: `${spec.action} (${spec.mode})`,
    description: `${spec.description} The human control is: ${spec.humanControl}`,
    type: 'object',
    properties: {
      action: { const: spec.action },
      ...Object.fromEntries(
        Object.entries(spec.params).map(([name, param]) => [
          name,
          { ...schemaOf(param), description: param.help },
        ]),
      ),
    },
    required: ['action', ...requiredNamesOf(spec.params)],
    examples: [spec.example],
  };
}

function objectSchema(params: Record<string, AbilityParamSpec>): object {
  return {
    type: 'object',
    properties: Object.fromEntries(
      Object.entries(params).map(([name, param]) => [
        name,
        { ...schemaOf(param), description: param.help },
      ]),
    ),
    required: requiredNamesOf(params),
  };
}

function requiredNamesOf(params: Record<string, AbilityParamSpec>): string[] {
  return Object.entries(params)
    .filter(([, param]) => param.optional !== true)
    .map(([name]) => name);
}

function schemaOf(param: AbilityParamSpec): object {
  if (param.kind === 'int') return { type: 'integer' };
  if (param.kind === 'number') return { type: 'number' };
  if (param.kind === 'json') return {};
  return { type: 'string' };
}
