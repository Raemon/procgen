import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { PuzzleCues } from '../circuits/puzzleCues';
import { JUMP_MS } from '../sim/movementOrder';
import type { SoundCue, SoundPlayer } from '../sound/soundSynth';
import { loudnessFrom, playWorldSounds } from '../sound/worldSounds';
import { World } from '../world';
import { sceneWithOneCrate } from './cueScenes';
import { FLAT_GROUND, stepRulesOn } from './rulesFixtures';

export function checkWorldSounds(check: CheckReporter): void {
  const heard: Array<[SoundCue, number]> = [];
  let disposed = false;
  let now = 0;
  let on = true;
  const player: SoundPlayer = {
    play: (cue, volume = 1) => heard.push([cue, volume]),
    dispose: () => (disposed = true),
  };
  const world = new World(stepRulesOn(FLAT_GROUND));
  const scene = sceneWithOneCrate();
  const cues = new PuzzleCues(scene.source);
  const stop = playWorldSounds({ world, puzzleCues: cues }, player, () => on, { now: () => now });
  world.tryStep(1, 0);
  check('a step sounds a footfall', heard.map(([cue]) => cue).join() === 'step');
  world.tryJump(1, 0);
  check('a jump sounds once and its landing step is folded into it', heard.map(([cue]) => cue).join() === 'step,jump');
  now += JUMP_MS;
  world.tryStep(1, 0);
  check('walking on after the jump sounds footfalls again', heard.map(([cue]) => cue).join() === 'step,jump,step');
  heard.length = 0;
  cues.sync({ x: world.playerX, y: world.playerY });
  scene.crates[0] = { x: 4, y: 3 };
  cues.sync({ x: world.playerX, y: world.playerY });
  scene.circuit.plates[0]!.lit = true;
  scene.circuit.doors[0]!.open = true;
  scene.circuit.powered = true;
  cues.sync({ x: world.playerX, y: world.playerY });
  check(
    'a push, a plate, a door and the power each get their own sound, quieter the farther they happen',
    heard.map(([cue]) => cue).join() === 'push,plate,door,power' && heard[0]![1] > heard[1]![1],
  );
  check(
    'loudness is full on the spot and halves six tiles away',
    loudnessFrom({ playerX: 0, playerY: 0 }, [{ x: 0, y: 0 }]) === 1 && loudnessFrom({ playerX: 0, playerY: 0 }, [{ x: 6, y: 0 }]) === 0.5,
  );
  heard.length = 0;
  on = false;
  world.tryStep(1, 0);
  check('with sound off nothing plays', heard.length === 0);
  on = true;
  stop();
  world.tryStep(1, 0);
  check('stopping disposes the player and unhooks the world', disposed && heard.length === 0);
}
