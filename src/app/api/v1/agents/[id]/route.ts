import { agentRoute } from '@/infrastructure/api/agentRoute';

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: Context) {
  return agentRoute(request, `/agents/${(await context.params).id}`);
}

export async function DELETE(request: Request, context: Context) {
  return agentRoute(request, `/agents/${(await context.params).id}`);
}
