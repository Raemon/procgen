import { agentRoute } from '@/infrastructure/api/agentRoute';

export const GET = (request: Request) => agentRoute(request, '/agents');
export const POST = (request: Request) => agentRoute(request, '/agents');
