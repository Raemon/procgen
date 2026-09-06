import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { cellKeyOf } from '../circuits/circuit';
import { CUE_EARSHOT_TILES, PuzzleCues } from '../circuits/puzzleCues';
import { listenTo, sceneWithOneCrate } from './cueScenes';

export function checkPuzzleCues(check: CheckReporter): void {
  checkCuesFireOnceForEachChange(check);
  checkCuesIgnoreWhatScrollsIntoEarshot(check);
}

function checkCuesFireOnceForEachChange(check: CheckReporter): void {
  const scene = sceneWithOneCrate();
  const cues = new PuzzleCues(scene.source);
  const heard = listenTo(cues);
  cues.sync({ x: 0, y: 0 });
  check('the first look at a world is a silent baseline', heard.cells.size === 0);
  scene.crates[0] = { x: 4, y: 3 };
  cues.sync({ x: 0, y: 0 });
  cues.sync({ x: 0, y: 0 });
  check(
    'a crate that moved fires one push cue at the cell it arrived on',
    heard.cells.get('crate-pushed')?.length === 1 && cellKeyOf(heard.cells.get('crate-pushed')![0]![0]!) === '4,3',
  );
  check(
    'the push cue carries the cell the crate left as well as the one it reached',
    heard.pushes.length === 1 && cellKeyOf(heard.pushes[0]![0]!.from) === '3,3' && cellKeyOf(heard.pushes[0]![0]!.to) === '4,3',
  );
  scene.circuit.plates[0]!.lit = true;
  cues.sync({ x: 0, y: 0 });
  scene.circuit.doors[0]!.open = true;
  scene.circuit.powered = true;
  cues.sync({ x: 0, y: 0 });
  check(
    'a plate lighting, a door opening and the circuit powering each fire once at their own cells',
    cellKeyOf(heard.cells.get('plate-lit')![0]![0]!) === '5,5' &&
      cellKeyOf(heard.cells.get('door-opened')![0]![0]!) === '8,5' &&
      cellKeyOf(heard.cells.get('circuit-powered')![0]![0]!) === '8,5' &&
      (['plate-lit', 'door-opened', 'circuit-powered'] as const).every((cue) => heard.cells.get(cue)!.length === 1),
  );
  heard.clear();
  scene.crates[0] = { x: 12, y: 12 };
  cues.sync({ x: 0, y: 0 });
  check('a crate that jumps home on a room reset is not a push', heard.cells.size === 0);
  heard.clear();
  cues.forget();
  scene.crates[0] = { x: 6, y: 3 };
  cues.sync({ x: 0, y: 0 });
  check('after forgetting, the next look is a silent baseline again', heard.cells.size === 0);
}

function checkCuesIgnoreWhatScrollsIntoEarshot(check: CheckReporter): void {
  const scene = sceneWithOneCrate();
  const farAway = CUE_EARSHOT_TILES + 3;
  scene.crates.push({ x: farAway, y: 0 });
  scene.circuit.plates[0] = { x: farAway, y: 5, lit: true };
  scene.circuit.doors[0] = { x: farAway + 3, y: 5, open: false };
  const cues = new PuzzleCues(scene.source);
  const heard = listenTo(cues);
  cues.sync({ x: 0, y: 0 });
  scene.circuit.doors[0]!.open = true;
  scene.circuit.powered = true;
  cues.sync({ x: farAway, y: 0 });
  check('a crate that scrolls into earshot as the player walks is not a push', !heard.cells.has('crate-pushed'));
  check('a circuit first seen already powered fires nothing', heard.cells.size === 0);
}
