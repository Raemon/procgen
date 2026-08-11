import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const COMMAND_OWNERS = [
  'src/features/asset-library/',
  'src/features/game/',
];

export function checkOnlyTheCommandLayerCanMutate(
  check: (name: string, condition: boolean) => void,
): void {
  check('the former global commands feature no longer exists', !existsSync('src/features/commands'));

  const commandFiles = filesUnder('src/features').filter((path) => path.endsWith('Commands.ts'));
  check('commands are owned by Asset Library or Game', commandFiles.every(hasProductOwner));

  const globalRegistries = filesUnder('src').filter((path) => /(?:ability|command)Registry\.ts$/i.test(path));
  check('there is no process-global ability or command registry', globalRegistries.length === 0);

  const sideEffectImports = filesUnder('src')
    .filter((path) => /\.tsx?$/.test(path))
    .filter((path) => /import ['"]@\/features\/(?:commands|asset-library\/commands|game\/commands)['"]/.test(readFileSync(path, 'utf8')));
  check('command catalogs are composed explicitly instead of populated by side effects', sideEffectImports.length === 0);

  const runtime = readFileSync('src/features/app-shell/runtime/appRuntime.ts', 'utf8');
  check('React mutations cross the named command boundary', runtime.includes('performCommand('));
}

function hasProductOwner(path: string): boolean {
  return COMMAND_OWNERS.some((owner) => path.startsWith(owner));
}

function filesUnder(root: string): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name);
    return entry.isDirectory() ? filesUnder(path) : [path];
  });
}
