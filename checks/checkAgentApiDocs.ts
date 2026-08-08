import { FAILURES } from '../agents/failures';
import { nodeTypesJson } from '../agents/nodeCatalog';
import { buildApiDocs, everyAbility } from '../api/docs/apiDocs';
import { allNodeTypes } from '../procgen/nodeRegistry';
import {
  DEFAULT_CHARACTER_SIGHT_RADIUS_TILES,
  characterViewSize,
} from '../world/vision/characterSight';
import type { CheckReporter } from './checkReporter';
import { tileAssets } from './pipelineWorldFixtures';

const CHARACTER_VIEW_SIZE_AT_DEFAULT_SIGHT = characterViewSize();

export function checkAgentApiDocs(check: CheckReporter): void {
  const agentDocs = buildApiDocs(tileAssets);
  check('api docs state the character sight radius and grid size', agentDocs.includes(`${DEFAULT_CHARACTER_SIGHT_RADIUS_TILES}-tile sight radius`) && agentDocs.includes(`${CHARACTER_VIEW_SIZE_AT_DEFAULT_SIGHT}x${CHARACTER_VIEW_SIZE_AT_DEFAULT_SIGHT}`));
  check('api docs render with no unfilled placeholder', !/\{\{\w+\}\}/.test(agentDocs));
  check('api docs list every ability of both modes', everyAbility().every((spec) => agentDocs.includes(`\`${spec.action}\``)));
  check('api docs list every failure code', FAILURES.every((failure) => agentDocs.includes(`\`${failure.code}\``)));
  check("api docs legend names every tile asset symbol", tileAssets.all().every((tile) => agentDocs.includes(`'${tile.symbol}' = ${tile.name}`)));
  check('api docs list every registered node type', allNodeTypes().every((def) => agentDocs.includes(`\`${def.type}\``)));
  check('api docs render an example body for every ability that takes params', everyAbility().filter((spec) => Object.keys(spec.params).length > 0).every((spec) => agentDocs.includes(JSON.stringify(spec.example))));
  check('api docs name the human control for every ability', everyAbility().every((spec) => agentDocs.includes(spec.humanControl)));
  check('every registered node type serializes into the catalog', nodeTypesJson().types.length === allNodeTypes().length);
}
