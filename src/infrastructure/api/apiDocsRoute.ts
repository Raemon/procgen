import { buildApiDocs } from '@/features/agents/api/docs/apiDocs';
import { currentServerWorld } from '@/features/agents/api/serverWorld';
import { processServices } from '@/infrastructure/server/processServices';

export function apiDocsRoute(): Response {
  const services = processServices();
  services.agents.world = currentServerWorld(services.docs, services.agents.world);
  return new Response(buildApiDocs(services.agents.world.tileAssets), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
