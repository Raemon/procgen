import { handleApiRequest } from '@/features/agents/api/handleApiRequest';
import type { ApiResponse } from '@/features/agents/api/apiMessages';
import { currentServerWorld, persistWorld, type WorldAccess } from '@/features/agents/api/serverWorld';
import { processServices } from '@/infrastructure/server/processServices';

export async function agentRoute(request: Request, path: string): Promise<Response> {
  const services = processServices();
  const response = handleApiRequest(services.agents.sessions, worldAccess(), {
    method: request.method,
    path,
    query: new URL(request.url).searchParams,
    body: await requestBody(request),
  });
  return webResponse(response);

  function worldAccess(): WorldAccess {
    return {
      current: () => {
        services.agents.world = currentServerWorld(services.docs, services.agents.world);
        return services.agents.world;
      },
      persistWorld: (world) => {
        persistWorld(services.docs, world);
        services.documentChanged('pipeline');
      },
    };
  }
}

async function requestBody(request: Request): Promise<unknown> {
  if (request.method === 'GET' || request.method === 'HEAD') return null;
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function webResponse(response: ApiResponse): Response {
  return new Response(response.body, {
    status: response.status,
    headers: { 'Content-Type': response.contentType },
  });
}
