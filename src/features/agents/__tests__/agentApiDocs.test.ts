import '@/features/asset-library/worlds/nodes';
import { FAILURES } from '../failures';
import { nodeTypesJson } from '../nodeCatalog';
import { buildApiDocs, everyCommand } from '../api/docs/apiDocs';
import { allNodeTypes } from '@/features/asset-library/worlds/nodeRegistry';
import { DEFAULT_CHARACTER_SIGHT_RADIUS_TILES } from '@/features/game/vision/characterSight';
import { CHARACTER_VIEW_SIZE_AT_DEFAULT_SIGHT } from './agentObservation.test';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { tileAssets } from '@/features/asset-library/worlds/__tests__/pipelineWorldFixtures';

export function checkAgentApiDocs(check: CheckReporter): void {
  const agentDocs = buildApiDocs(tileAssets);
  check('api docs state the character sight radius and grid size', agentDocs.includes(`${DEFAULT_CHARACTER_SIGHT_RADIUS_TILES}-tile sight radius`) && agentDocs.includes(`${CHARACTER_VIEW_SIZE_AT_DEFAULT_SIGHT}x${CHARACTER_VIEW_SIZE_AT_DEFAULT_SIGHT}`));
  check('api docs render with no unfilled placeholder', !/\{\{\w+\}\}/.test(agentDocs));
  check('api docs list every command of both modes', everyCommand().every((spec) => agentDocs.includes(`\`${spec.action}\``)));
  check('api docs list every failure code', FAILURES.every((failure) => agentDocs.includes(`\`${failure.code}\``)));
  check("api docs legend names every tile asset symbol", tileAssets.all().every((tile) => agentDocs.includes(`'${tile.symbol}' = ${tile.name}`)));
  check('api docs list every registered node type', allNodeTypes().every((def) => agentDocs.includes(`\`${def.type}\``)));
  check('api docs render an example body for every command that takes params', everyCommand().filter((spec) => Object.keys(spec.params).length > 0).every((spec) => agentDocs.includes(JSON.stringify(spec.example))));
  check('api docs name the human control for every command', everyCommand().every((spec) => agentDocs.includes(spec.humanControl)));
  check('every registered node type serializes into the catalog', nodeTypesJson().types.length === allNodeTypes().length);
}
