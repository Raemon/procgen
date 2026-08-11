import { healthOf } from '@/infrastructure/server/procgenServices';
import { processServices } from '@/infrastructure/server/processServices';

export const dynamic = 'force-dynamic';

export function GET() {
  const services = processServices();
  return Response.json({
    ...healthOf(services.loop, services.registry),
    persistence: services.store.enabled,
  });
}
