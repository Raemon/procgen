import { heaviestHostProcesses } from '@/features/game/performance/heaviestHostProcesses';
import { serverProcessSnapshot } from '@/features/game/performance/serverProcessSnapshot';
import { processServices } from '@/infrastructure/server/processServices';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const local = request.headers.get('x-forwarded-for') === null;
  const services = processServices();
  return Response.json({
    process: serverProcessSnapshot(),
    eventLoopLagMs: services.eventLoopLagMs(),
    hostProcesses: local ? await heaviestHostProcesses() : [],
    hostProcessesWithheld: !local,
  });
}
