import { createServer } from 'node:http';
import next from 'next';
import { createProcgenServices } from '@/infrastructure/server/procgenServices';
import { setProcessServices } from '@/infrastructure/server/processServices';

async function startServer(): Promise<void> {
  const dev = process.env.NODE_ENV !== 'production';
  const services = await createProcgenServices();
  const app = next({
    dev,
    hostname: '0.0.0.0',
    port: services.config.port,
  });
  await app.prepare();
  setProcessServices(services);
  const handleNextRequest = app.getRequestHandler();
  const server = createServer((request, response) => {
    void handleNextRequest(request, response);
  });
  const detachGameSocket = services.attachGameSocket(server);
  const close = shutdownOnce(async () => {
    detachGameSocket();
    await services.stop();
    server.close();
  });
  process.on('SIGTERM', close);
  process.on('SIGINT', close);
  server.listen(services.config.port, '0.0.0.0', () => {
    console.log(`[server] procgen listening on http://localhost:${services.config.port}`);
  });
}

function shutdownOnce(shutdown: () => Promise<void>): () => void {
  let shuttingDown = false;
  return () => {
    if (shuttingDown) return;
    shuttingDown = true;
    void shutdown().finally(() => process.exit(0));
  };
}

void startServer().catch((error) => {
  console.error('[server] failed to start', error);
  process.exit(1);
});
