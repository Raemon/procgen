import { agentRoute } from '@/infrastructure/api/agentRoute';

interface Context {
  params: Promise<{ key: string }>;
}

export async function GET(request: Request, context: Context) {
  return agentRoute(request, `/asset-library/world-seeds/builds/${(await context.params).key}`);
}
