import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

export const WORKER_ENTRY = 'src/infrastructure/server/worldBuilds/worldBuildWorker.ts';
export const WORKER_BUNDLE = 'dist/workers/worldBuildWorker.mjs';

export function workerBundlePath(root: string = process.cwd()): () => Promise<string | null> {
  let resolved: Promise<string | null> | null = null;
  return () => {
    resolved ??= locateOrBundle(root);
    return resolved;
  };
}

async function locateOrBundle(root: string): Promise<string | null> {
  const bundle = resolve(root, WORKER_BUNDLE);
  if (existsSync(bundle) && process.env.NODE_ENV === 'production') return bundle;
  try {
    const esbuild = await import('esbuild');
    await esbuild.build({
      entryPoints: [resolve(root, WORKER_ENTRY)],
      bundle: true,
      platform: 'node',
      format: 'esm',
      packages: 'external',
      logLevel: 'error',
      outfile: bundle,
    });
    console.log(`[builds] bundled the world build worker (${Math.round(statSync(bundle).size / 1024)} KB)`);
    return bundle;
  } catch (error) {
    if (existsSync(bundle)) return bundle;
    console.warn(`[builds] could not bundle the world build worker: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}
