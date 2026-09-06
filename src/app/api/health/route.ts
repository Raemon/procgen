import { healthOf } from '@/infrastructure/server/health';
import { processServices } from '@/infrastructure/server/processServices';

export const dynamic = 'force-dynamic';

export function GET() {
  const services = processServices();
  return Response.json({
    ...healthOf(services.loop, services.registry, services.agents.builds),
    persistence: services.store.enabled,
    commit: process.env.RENDER_GIT_COMMIT ?? null,
  });
}
