import '../procgen/nodes';
import { sanitizePipeline } from '../procgen/pipeline/sanitizePipeline';
import { builtInTemplates } from '../procgen/templates/builtInTemplates';
import { stampTemplateInto } from '../procgen/templates/stampTemplate';
import { templateFromNodes } from '../procgen/templates/templateFromNodes';
import { sanitizeTemplates } from '../procgen/templates/nodeTemplate';
import { nodeFolderRuns } from '../procgen/panel/nodeFolderRuns';
import { asField } from '../procgen/values/valueAccess';
import type { CheckReporter } from './checkReporter';
import { earthlikeState, worldFromState } from './pipelineWorldFixtures';
import { SLOPE_FOLDER } from './terrainFixtureState';

export function checkTemplates(check: CheckReporter): void {
  const templates = builtInTemplates();
  check('every built-in template survives sanitize with all of its nodes', templates.length === 5 && templates.every((template) => template.nodes.length > 0));
  check(
    'every built-in template describes itself and comments every node',
    templates.every((template) => template.description.length > 0 && template.nodes.every((node) => node.comment.length > 0)),
  );

  const stampTarget = sanitizePipeline({ seed: 8, nodes: [{ id: 'n1', type: 'terrainNoise', params: {}, inputs: {} }] });
  const plates = templates.find((template) => template.name === 'tectonic plates')!;
  const stamped = stampTemplateInto(stampTarget, plates, stampTarget.nodes.length);
  check('stamping a template makes fresh ids that cannot collide', new Set(stampTarget.nodes.map((node) => node.id)).size === stampTarget.nodes.length);
  check('a stamped template lands in a folder named after itself', stamped.every((node) => node.folder === plates.name));
  check(
    'wiring inside a stamped template is remapped onto its new ids',
    stamped[3]!.inputs.source === stamped[0]!.id && stamped[3]!.inputs.offsetX === stamped[1]!.id,
  );
  const stampedWorld = worldFromState(stampTarget);
  check(
    'a stamped template generates without error',
    stamped.every((node) => stampedWorld.evaluator.errorFor(node.id) === null) &&
      asField(stampedWorld.evaluator.valueFor(stamped[3]!.id, 0, 0)) !== null,
  );

  const capturedRun = nodeFolderRuns(sanitizePipeline(earthlikeState()).nodes).find((run) => run.folder === SLOPE_FOLDER)!;
  const captured = templateFromNodes(capturedRun.nodes, SLOPE_FOLDER, 'captured from the fixture');
  check(
    'saving a folder as a template keeps wiring inside it and opens wiring to nodes outside',
    captured.nodes[1]!.inputs.source === captured.nodes[0]!.id && captured.nodes[0]!.inputs.source === null,
  );
  check(
    'a saved template round-trips through storage',
    sanitizeTemplates(JSON.parse(JSON.stringify([captured]))).length === 1,
  );
  check('templates reject junk', sanitizeTemplates([{ name: '', nodes: [] }, null, 7]).length === 0);
}
