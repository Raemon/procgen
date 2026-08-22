import { agentRoute } from '@/infrastructure/api/agentRoute';

interface Context {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: Context) {
  return agentRoute(request, `/asset-library/worlds/lab/${(await context.params).id}/install`);
}
