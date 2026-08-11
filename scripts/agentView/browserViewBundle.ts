import { build, type Plugin } from 'esbuild';

const BROWSER_ENTRY_POINT = 'scripts/agentView/browser/renderWorldViewInPage.ts';
const REPO_DATA_FILE_SYSTEM = 'scripts/agentView/browser/repoDataFilesAsFileSystem.ts';

export async function browserViewBundle(): Promise<string> {
  const result = await build({
    entryPoints: [BROWSER_ENTRY_POINT],
    bundle: true,
    format: 'iife',
    platform: 'browser',
    write: false,
    logLevel: 'error',
    plugins: [repoDataFilesInsteadOfNodeFs()],
  });
  return result.outputFiles[0]!.text;
}

function repoDataFilesInsteadOfNodeFs(): Plugin {
  return {
    name: 'repo-data-files-instead-of-node-fs',
    setup(pluginBuild) {
      pluginBuild.onResolve({ filter: /^(node:)?fs$/ }, () => ({
        path: `${process.cwd()}/${REPO_DATA_FILE_SYSTEM}`,
      }));
    },
  };
}
