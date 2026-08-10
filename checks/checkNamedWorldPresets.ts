import '../procgen/nodes';
import type { PipelineState } from '../procgen/pipeline/pipelineState';
import { sanitizePipeline } from '../procgen/pipeline/sanitizePipeline';
import { examplePipelines } from '../procgen/presets/examplePipelines';
import { sanitizeWorldPresets } from '../procgen/presets/worldPreset';
import { asField } from '../procgen/values/valueAccess';
import { WorldSampler } from '../procgen/worldSampler';
import type { CheckReporter } from './checkReporter';
import {
  earthlikeState,
  fieldBytes,
  tileBytes,
  tileIdsInRegion,
  worldFromState,
} from './pipelineWorldFixtures';

function presetStateNamed(name: string): PipelineState {
  return sanitizePipeline(examplePipelines().find((preset) => preset.name === name)!.state);
}

function tileIdsInRect(
  sampler: WorldSampler,
  centerX: number,
  centerY: number,
  halfWidth: number,
  halfHeight: number,
): Set<number> {
  const seen = new Set<number>();
  for (let y = centerY - halfHeight; y < centerY + halfHeight; y++) {
    for (let x = centerX - halfWidth; x < centerX + halfWidth; x++) seen.add(sampler.tileAt(x, y));
  }
  return seen;
}

export function checkNamedWorldPresets(check: CheckReporter): void {
  const earthlike = worldFromState(earthlikeState());
  const earthlikeAgain = worldFromState(earthlikeState());
  check(
    'the earthlike preset regenerates identically from the same seed',
    tileBytes(earthlike.evaluator, 'n16', 1, 1) === tileBytes(earthlikeAgain.evaluator, 'n16', 1, 1) &&
      fieldBytes(earthlike.evaluator, 'n12', 1, 1) === fieldBytes(earthlikeAgain.evaluator, 'n12', 1, 1),
  );
  const waters = worldFromState(presetStateNamed('mountains, lakes & rapids'));
  const watersAgain = worldFromState(presetStateNamed('mountains, lakes & rapids'));
  check(
    'the mountains, lakes & rapids preset survives sanitize with all nodes',
    presetStateNamed('mountains, lakes & rapids').nodes.length === 28,
  );
  check(
    'the mountains, lakes & rapids preset regenerates identically from the same seed',
    fieldBytes(waters.evaluator, 'lakeSurface', 1, 1) === fieldBytes(watersAgain.evaluator, 'lakeSurface', 1, 1) &&
      tileBytes(waters.evaluator, 'lakes', 1, 1) === tileBytes(watersAgain.evaluator, 'lakes', 1, 1),
  );

  const metropolis = worldFromState(presetStateNamed('fallen metropolis'));
  const metropolisAgain = worldFromState(presetStateNamed('fallen metropolis'));
  check(
    'the fallen metropolis preset survives sanitize with all nodes',
    presetStateNamed('fallen metropolis').nodes.length === 28,
  );
  check(
    'the fallen metropolis regenerates identically from the same seed',
    fieldBytes(metropolis.evaluator, 'n9', 1, 1) === fieldBytes(metropolisAgain.evaluator, 'n9', 1, 1) &&
      tileBytes(metropolis.evaluator, 'n10', 1, 1) === tileBytes(metropolisAgain.evaluator, 'n10', 1, 1),
  );
  const metropolisTiles = tileIdsInRegion(metropolis.sampler, 96);
  check(
    'the fallen metropolis shows stone walls, flagstone streets, rubble and reclaiming grass',
    [17, 16, 9, 2].every((tile) => metropolisTiles.has(tile)),
  );
  check('the risen sea drowns part of the fallen metropolis', metropolisTiles.has(0));
  const districtFate = asField(metropolis.evaluator.valueFor('n9', 0, 0))!;
  const districtFateEast = asField(metropolis.evaluator.valueFor('n9', 1, 0))!;
  check(
    'district fate varies between districts but stays inside 0..1',
    JSON.stringify(Array.from(districtFate)) !== JSON.stringify(Array.from(districtFateEast)) &&
      [...districtFate, ...districtFateEast].every((value) => value >= 0 && value <= 1),
  );

  const climates = worldFromState(presetStateNamed('pole to equator'));
  const climatesAgain = worldFromState(presetStateNamed('pole to equator'));
  check(
    'the pole to equator preset survives sanitize with all nodes',
    presetStateNamed('pole to equator').nodes.length === 41,
  );
  check(
    'the pole to equator preset regenerates identically from the same seed',
    fieldBytes(climates.evaluator, 'n20', 1, 1) === fieldBytes(climatesAgain.evaluator, 'n20', 1, 1) &&
      tileBytes(climates.evaluator, 'n31', 0, -20) === tileBytes(climatesAgain.evaluator, 'n31', 0, -20),
  );
  const polarTiles = tileIdsInRect(climates.sampler, 0, -700, 96, 16);
  const temperateTiles = tileIdsInRect(climates.sampler, 0, 0, 96, 16);
  const desertTiles = tileIdsInRect(climates.sampler, 0, 700, 96, 16);
  check('the far north of pole to equator is snow or ice', polarTiles.has(7) || polarTiles.has(6));
  check('the middle latitudes of pole to equator grow grass', temperateTiles.has(2));
  check('the far south of pole to equator is sand', desertTiles.has(1));
  check(
    'grass belongs to the middle latitudes, not the polar cap',
    !polarTiles.has(2) && temperateTiles.has(2),
  );

  const marches = worldFromState(presetStateNamed('the ember marches'));
  const marchesAgain = worldFromState(presetStateNamed('the ember marches'));
  check(
    'the ember marches preset survives sanitize with all nodes',
    presetStateNamed('the ember marches').nodes.length === 51,
  );
  check(
    'the ember marches regenerates identically from the same seed',
    fieldBytes(marches.evaluator, 'n14', 1, 1) === fieldBytes(marchesAgain.evaluator, 'n14', 1, 1) &&
      tileBytes(marches.evaluator, 'n23', 15, -3) === tileBytes(marchesAgain.evaluator, 'n23', 15, -3),
  );
  const greenMarchTiles = tileIdsInRect(marches.sampler, -600, 0, 48, 32);
  const ashfallTiles = tileIdsInRect(marches.sampler, 600, 0, 96, 64);
  check('the green west of the ember marches grows grass', greenMarchTiles.has(2));
  check(
    'the eastern ashfall is ash and lava, and grass does not grow there',
    ashfallTiles.has(22) && ashfallTiles.has(21) && !ashfallTiles.has(2),
  );

  check(
    'a saved world preset round-trips through storage with its seed and nodes',
    (() => {
      const saved = sanitizeWorldPresets(
        JSON.parse(JSON.stringify([{ name: 'mine', description: 'combo', state: earthlikeState() }])),
      );
      return saved.length === 1 && saved[0]!.state.seed === earthlikeState().seed && saved[0]!.state.nodes.length === earthlikeState().nodes.length;
    })(),
  );
  check(
    'world presets reject junk',
    sanitizeWorldPresets([{ name: '', state: earthlikeState() }, { name: 'empty', state: { nodes: [] } }, null, 7]).length === 0,
  );
}
