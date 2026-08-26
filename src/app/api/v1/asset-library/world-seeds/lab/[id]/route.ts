import { agentRoute } from '@/infrastructure/api/agentRoute';

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: Context) {
  return agentRoute(request, `/asset-library/world-seeds/lab/${(await context.params).id}`);
}
