import { agentRoute } from '@/infrastructure/api/agentRoute';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return agentRoute(request, `/agents/${(await params).id}/stop`);
}
