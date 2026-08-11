import '@/features/asset-library/worlds/nodes';
import { nodeTypesJson } from '@/features/agents/nodeCatalog';

export function GET() {
  return Response.json(nodeTypesJson(), {
    headers: { 'Cache-Control': 'no-store' },
  });
}
