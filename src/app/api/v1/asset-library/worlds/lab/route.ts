import { agentRoute } from '@/infrastructure/api/agentRoute';

export const GET = (request: Request) => agentRoute(request, '/asset-library/worlds/lab');
