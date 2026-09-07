import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { PuzzleCues } from '../circuits/puzzleCues';
import { Fight } from '../combat/fight';
import { JUMP_MS } from '../sim/movementOrder';
import type { FootingTerrain } from '../sound/footing';
import type { OpenSpace } from '../sound/roomSense';
import type { SoundCue } from '../sound/soundCues';
import type { SoundPlayer } from '../sound/soundPlayer';
import type { SoundShape } from '../sound/soundRecipe';
import { STRIDE_REST_MS } from '../sound/stride';
import { loudnessFrom, playWorldSounds, type SoundClock } from '../sound/worldSounds';
import type { Cell } from '../worldRules';
import { World } from '../world';
import { sceneWithOneCrate, type CueScene } from './cueScenes';
import { FLAT_GROUND, stepRulesOn } from './rulesFixtures';

type SoundTerrain = FootingTerrain & OpenSpace;

const OPEN_FLOOR: SoundTerrain = { isWalkable: () => true, surfaceAt: () => 0, cratesIn: () => [] };

interface Heard {
  cue: SoundCue;
  shape: Partial<SoundShape>;
}

interface Soundscape {
  world: World;
  scene: CueScene;
  cues: PuzzleCues;
  fight: Fight;
  heard: Heard[];
  advance(ms: number): void;
  listen(on: boolean): void;
  disposed(): boolean;
  stop(): void;
}

export function checkWorldSounds(check: CheckReporter): void {
  checkFootfallsAndJumps(check);
  checkMomentumAndSettling(check);
  checkSurfacesUnderfoot(check);
  checkTheRoomAnswers(check);
  checkShovingACrate(check);
  checkLoudnessAndSilence(check);
  checkCombatSounds(check);
}

function checkFootfallsAndJumps(check: CheckReporter): void {
  const scape = soundscape();
  scape.world.tryStep(1, 0);
  check('a step sounds a footfall', cuesOf(scape) === 'step');
  scape.world.tryJump(1, 0);
  check('a jump sounds once and its landing step is folded into it', cuesOf(scape) === 'step,jump');
  scape.advance(JUMP_MS);
  scape.world.tryStep(1, 0);
  check('walking on after the jump sounds footfalls again', cuesOf(scape) === 'step,jump,step');
  scape.stop();
}

function checkMomentumAndSettling(check: CheckReporter): void {
  const scape = soundscape();
  for (let step = 0; step < 5; step++) scape.world.tryStep(1, 0);
  const gathering = scape.heard.map((heard) => heard.shape.effort ?? 0);
  check(
    'a run in one direction gathers momentum',
    gathering.length === 5 && gathering.every((effort, index) => index === 0 || effort > gathering[index - 1]!),
  );
  scape.world.tryStep(0, 1);
  check('turning a corner spends the momentum', (scape.heard.at(-1)!.shape.effort ?? 1) === 0);
  scape.heard.length = 0;
  scape.world.tryStep(0, 1);
  scape.world.tryStep(0, 1);
  scape.advance(STRIDE_REST_MS);
  check('coming to a stop lands with its own sound', cuesOf(scape) === 'step,step,settle');
  scape.heard.length = 0;
  scape.world.tryStep(1, 0);
  scape.advance(STRIDE_REST_MS);
  check('a single step is not a run and does not settle', cuesOf(scape) === 'step');
  scape.stop();
}

function checkSurfacesUnderfoot(check: CheckReporter): void {
  const ledge = soundscape({ ...OPEN_FLOOR, surfaceAt: (x) => (x >= 1 ? 0.5 : 0) });
  ledge.world.tryStep(1, 0);
  check('climbing onto a ledge is not the sound of walking', cuesOf(ledge) === 'climb');
  ledge.stop();
  const crates = soundscape({ ...OPEN_FLOOR, cratesIn: (minX, minY) => (minX === 1 && minY === 0 ? [{ x: 1, y: 0 }] : []) });
  crates.world.tryStep(1, 0);
  check('stepping onto a crate top knocks instead of scuffing', cuesOf(crates) === 'crate-step');
  crates.stop();
}

function checkTheRoomAnswers(check: CheckReporter): void {
  const cell = ({ x, y }: Cell): boolean => x >= 0 && x <= 2 && y >= 0 && y <= 2;
  const cupboard = soundscape({ ...OPEN_FLOOR, isWalkable: (x, y) => cell({ x, y }) });
  cupboard.world.tryStep(1, 0);
  const hall = soundscape();
  hall.world.tryStep(1, 0);
  const tight = cupboard.heard[0]!.shape.roomSize ?? 1;
  const open = hall.heard[0]!.shape.roomSize ?? 0;
  check('a cupboard of a room rings smaller than an open hall', tight < 0.3 && open === 1);
  cupboard.stop();
  hall.stop();
}

function checkShovingACrate(check: CheckReporter): void {
  const scape = soundscape();
  scape.world.tryStep(1, 0);
  scape.world.tryStep(1, 0);
  scape.cues.sync({ x: scape.world.playerX, y: scape.world.playerY });
  scape.scene.crates[0] = { x: 4, y: 3 };
  scape.heard.length = 0;
  scape.cues.sync({ x: scape.world.playerX, y: scape.world.playerY });
  const push = scape.heard.find((heard) => heard.cue === 'push');
  check('a shove grinds for as long as the crate is moving', (push?.shape.seconds ?? 0) > 0.15);
  check('a shove made at a run carries the momentum of the run', (push?.shape.effort ?? 0) > 0);
  scape.stop();
}

function checkLoudnessAndSilence(check: CheckReporter): void {
  const scape = soundscape();
  scape.cues.sync({ x: scape.world.playerX, y: scape.world.playerY });
  scape.scene.crates[0] = { x: 4, y: 3 };
  scape.scene.circuit.plates[0]!.lit = true;
  scape.scene.circuit.doors[0]!.open = true;
  scape.scene.circuit.powered = true;
  scape.heard.length = 0;
  scape.cues.sync({ x: scape.world.playerX, y: scape.world.playerY });
  check(
    'a push, a plate, a door and the power each get their own sound, quieter the farther they happen',
    cuesOf(scape) === 'push,plate,door,power' &&
      (scape.heard[0]!.shape.volume ?? 0) > (scape.heard[1]!.shape.volume ?? 0),
  );
  check(
    'loudness is full on the spot and halves six tiles away',
    loudnessFrom({ playerX: 0, playerY: 0 }, [{ x: 0, y: 0 }]) === 1 &&
      loudnessFrom({ playerX: 0, playerY: 0 }, [{ x: 6, y: 0 }]) === 0.5,
  );
  scape.heard.length = 0;
  scape.listen(false);
  scape.world.tryStep(1, 0);
  scape.advance(STRIDE_REST_MS);
  check('with sound off nothing plays', scape.heard.length === 0);
  scape.listen(true);
  scape.stop();
  scape.world.tryStep(1, 0);
  check('stopping disposes the player and unhooks the world', scape.disposed() && scape.heard.length === 0);
}

function checkCombatSounds(check: CheckReporter): void {
  const scape = soundscape();
  scape.heard.length = 0;
  scape.fight.strikeCreature('gaunt', 4, 2, { x: scape.world.playerX, y: scape.world.playerY });
  scape.fight.strikeCreature('gaunt', 4, 2, { x: scape.world.playerX, y: scape.world.playerY });
  scape.fight.strikePlayer(1, { x: scape.world.playerX, y: scape.world.playerY });
  check(
    'a blow landing, a creature going down and the player being raked each get their own sound',
    cuesOf(scape) === 'strike,slain,hurt',
  );
  scape.stop();
}

function cuesOf(scape: Soundscape): string {
  return scape.heard.map((heard) => heard.cue).join();
}

function soundscape(terrain: SoundTerrain = OPEN_FLOOR): Soundscape {
  const heard: Heard[] = [];
  const waiting: Array<{ due: number; run: () => void }> = [];
  let now = 0;
  let on = true;
  let disposed = false;
  const clock: SoundClock = {
    now: () => now,
    after: (ms, run) => {
      const waited = { due: now + ms, run };
      waiting.push(waited);
      return () => waiting.splice(waiting.indexOf(waited), 1);
    },
  };
  const player: SoundPlayer = {
    play: (cue, shape = {}) => heard.push({ cue, shape }),
    dispose: () => (disposed = true),
  };
  const world = new World(stepRulesOn(FLAT_GROUND));
  const scene = sceneWithOneCrate();
  const cues = new PuzzleCues(scene.source);
  const fight = new Fight({ vigor: () => 6, strength: () => 2 });
  const stop = playWorldSounds({ world, rules: terrain, puzzleCues: cues, fight }, player, () => on, clock);
  return {
    world,
    scene,
    cues,
    fight,
    heard,
    advance: (ms) => {
      now += ms;
      for (const waited of waiting.filter((one) => one.due <= now)) {
        waiting.splice(waiting.indexOf(waited), 1);
        waited.run();
      }
    },
    listen: (listening) => (on = listening),
    disposed: () => disposed,
    stop,
  };
}
