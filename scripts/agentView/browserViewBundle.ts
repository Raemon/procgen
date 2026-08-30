import { build } from 'esbuild';

const BROWSER_ENTRY_POINT = 'scripts/agentView/browser/renderWorldViewInPage.ts';

export async function browserViewBundle(): Promise<string> {
  const result = await build({
    entryPoints: [BROWSER_ENTRY_POINT],
    bundle: true,
    format: 'iife',
    platform: 'browser',
    write: false,
    logLevel: 'error',
  });
  return result.outputFiles[0]!.text;
}
