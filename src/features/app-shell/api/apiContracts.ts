export interface ApiContract {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  summary: string;
  requestBody?: object;
  requiresRevision?: boolean;
}

const DOCUMENT_RESOURCES = [
  ['/app-shell/state', 'persisted app-shell preferences'],
  ['/asset-library/tiles', 'tile definitions and art'],
  ['/asset-library/items', 'item definitions and art'],
  ['/asset-library/pieces', 'voxel piece definitions'],
  ['/asset-library/cultures', 'culture definitions and piece bindings'],
  ['/asset-library/creatures', 'creature and character definitions'],
  ['/asset-library/worlds', 'saved world definitions'],
  ['/asset-library/worlds/current', 'the world currently open in the editor'],
  ['/asset-library/worlds/thumbnails', 'saved world thumbnails'],
  ['/asset-library/node-groups', 'saved node groups'],
] as const;

export const API_CONTRACTS: readonly ApiContract[] = [
  ...DOCUMENT_RESOURCES.flatMap(([path, summary]) => [
    { method: 'GET' as const, path, summary: `read ${summary}` },
    {
      method: 'PUT' as const,
      path,
      summary: `replace ${summary}`,
      requiresRevision: true,
      requestBody: {},
    },
  ]),
  {
    method: 'GET',
    path: '/asset-library/node-types',
    summary: 'list every procedural node type and its parameters',
  },
  { method: 'GET', path: '/agents', summary: 'list agents' },
  {
    method: 'POST',
    path: '/agents',
    summary: 'create an agent',
    requestBody: {
      type: 'object',
      properties: {
        mode: { enum: ['god', 'character'] },
        name: { type: 'string' },
      },
      required: ['mode'],
    },
  },
  { method: 'GET', path: '/agents/{id}', summary: 'read one agent' },
  { method: 'DELETE', path: '/agents/{id}', summary: 'remove one agent' },
  { method: 'GET', path: '/agents/{id}/observe', summary: 'observe from an agent position' },
  {
    method: 'POST',
    path: '/agents/{id}/run',
    summary: 'start an autonomous agent run',
    requestBody: {
      type: 'object',
      properties: {
        goal: { type: 'string' },
        model: { type: 'string' },
        budget_usd: { type: 'number' },
        anthropic_api_key: { type: 'string' },
      },
      required: ['goal'],
    },
  },
  { method: 'POST', path: '/agents/{id}/stop', summary: 'stop an autonomous agent run' },
  { method: 'GET', path: '/agents/{id}/transcript', summary: 'read an agent run transcript' },
  { method: 'GET', path: '/game/performance', summary: 'read Game process performance' },
];
