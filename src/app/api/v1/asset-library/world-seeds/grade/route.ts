import { agentRoute } from '@/infrastructure/api/agentRoute';

export const POST = (request: Request) => agentRoute(request, '/asset-library/world-seeds/grade');
