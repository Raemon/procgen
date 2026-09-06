import * as THREE from 'three';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { WIRE_EAST, WIRE_NORTH, WIRE_SOUTH, WIRE_WEST } from '@/features/asset-library/tiles/art/fixtures/circuitWireArt';
import { SIDE_FACES } from '@/features/asset-library/tiles/tileFaceArt';
import type { Marker, WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import { cellKeyOf, cellWithin, circuitTouches, type Circuit } from '../circuits/circuit';
import { CUE_EARSHOT_TILES, PuzzleCues, type PuzzleCue, type PuzzleSource } from '../circuits/puzzleCues';
import { LIT_WIRE_GLOW, WIRE_LIES_FLAT, wireMarkersOf, wireMaskAt } from '../circuits/wireMarkers';
import { routeWires } from '../circuits/wireRoutes';
import { fixtureLook } from '../fixtures/fixtureAppearance';
import { DOOR_STANDS_TALL } from '../fixtures/looks/door';
import { pointOverlayLookup } from '../render/ascii/asciiCells';
import { DOOR_OPENING_SECONDS, DoorOpenings } from '../render/view3d/doorOpenings';
import { JUMP_MS } from '../sim/movementOrder';
import type { SoundCue, SoundPlayer } from '../sound/soundSynth';
import { loudnessFrom, playWorldSounds } from '../sound/worldSounds';
import { World } from '../world';
import { registerWorldRules, rulesWithDefaults, type Cell } from '../worldRules';
import { wiresJoin } from './circuitFixtures';
import { FLAT_GROUND, nodeOfType, rulesOn, stepRulesOn, storeWithNodes } from './rulesFixtures';

const ROOM = { minX: 0, minY: 0, maxX: 8, maxY: 6 };
const NEAR_PLATE = { x: 1, y: 1 };
const FAR_PLATE = { x: 1, y: 5 };
const EAST_DOOR = { x: 9, y: 3 };
const WIRED_SCENE = 'testWiredScene';
const SCENE_CIRCUIT: Circuit = {
  key: 'scene',
  plates: [{ x: 0, y: 0, lit: false }],
  doors: [{ x: 2, y: 2, open: false }],
  wires: [
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 2, y: 1 },
  ],
  powered: false,
};

registerWorldRules({
  nodeType: WIRED_SCENE,
  attach: ({ node }) =>
    rulesWithDefaults({
      nodeId: node.id,
      nodeType: WIRED_SCENE,
      owns: () => true,
      circuitsIn: () => [SCENE_CIRCUIT],
      cratesIn: () => [{ x: 1, y: 0 }],
      markersIn: () => [{ x: 1, y: 0, ...fixtureLook('crate', false) }],
    }),
});

export function checkCircuitsAndCues(check: CheckReporter): void {
  checkWiresRouteFromPlatesToDoors(check);
  checkWireMarkersReadTheirJoins(check);
  checkTheRulesSetLaysWiresUnderItsMarkers(check);
  checkCuesFireOnceForEachChange(check);
  checkCuesIgnoreWhatScrollsIntoEarshot(check);
  checkSoundsFollowTheWorld(check);
  checkADoorLiftsIntoItsLintel(check);
}

function checkWiresRouteFromPlatesToDoors(check: CheckReporter): void {
  const endpoints = [NEAR_PLATE, FAR_PLATE, EAST_DOOR];
  const wires = routeWires([NEAR_PLATE, FAR_PLATE], [EAST_DOOR], roomFloor);
  const isEndpoint = (cell: Cell) => endpoints.some((end) => end.x === cell.x && end.y === cell.y);
  check(
    'every wire cell lies on the floor and never on a plate or the door',
    wires.length > 0 && wires.every((cell) => roomFloor(cell.x, cell.y) && !isEndpoint(cell)),
  );
  const joined = new Set([...wires, ...endpoints].map(cellKeyOf));
  check(
    'each plate reaches the door along the wires',
    [NEAR_PLATE, FAR_PLATE].every((plate) => wiresJoin(joined, plate, EAST_DOOR)),
  );
  const alone = (plate: Cell) => routeWires([plate], [EAST_DOOR], roomFloor).length;
  check(
    'the second plate rides the first plate\'s trunk instead of laying its own line to the door',
    wires.length < alone(NEAR_PLATE) + alone(FAR_PLATE),
  );
  check(
    'routing the same room twice lays the same wires',
    JSON.stringify(routeWires([NEAR_PLATE, FAR_PLATE], [EAST_DOOR], roomFloor)) === JSON.stringify(wires),
  );
  const walledOff = (x: number, y: number) => roomFloor(x, y) && x < 4;
  check(
    'a door no floor reaches gets no wire at all',
    routeWires([NEAR_PLATE], [EAST_DOOR], walledOff).length === 0,
  );
}

function checkWireMarkersReadTheirJoins(check: CheckReporter): void {
  const dark = wireMarkersOf([SCENE_CIRCUIT], -9, -9, 9, 9);
  const lit = wireMarkersOf([{ ...SCENE_CIRCUIT, powered: true }], -9, -9, 9, 9);
  const glyphsOf = (markers: Marker[]) => markers.map((marker) => marker.glyph).join('');
  check(
    'runs read as lines, any bend or junction as a cross, and lit wires switch to double lines',
    glyphsOf(dark) === '─┼│' && glyphsOf(lit) === '═╬║',
  );
  check(
    'a lit wire glows and takes a brighter ink, a dark one does not glow',
    lit.every((marker) => marker.glow === LIT_WIRE_GLOW) && dark.every((marker) => !marker.glow) && lit[0]!.color !== dark[0]!.color,
  );
  check(
    'wires lie flatter than a plate and let the floor show through their unpainted art',
    dark.every(
      (marker) =>
        marker.standingHeight === WIRE_LIES_FLAT &&
        marker.standingHeight < fixtureLook('plate', false).standingHeight! &&
        marker.seeThroughUnpaintedArt === true &&
        marker.faceArt!.top.some((ink) => ink !== null) &&
        SIDE_FACES.every((face) => marker.faceArt![face].every((ink) => ink === null)),
    ),
  );
  check(
    'only the wires inside the asked rectangle are handed back',
    wireMarkersOf([SCENE_CIRCUIT], 2, 0, 2, 1).length === 2,
  );
  const joined = new Set(['0,-1', '1,0', '0,1', '-1,0']);
  check(
    'a cell joined on every side carries all four bits',
    wireMaskAt({ x: 0, y: 0 }, joined) === (WIRE_NORTH | WIRE_EAST | WIRE_SOUTH | WIRE_WEST),
  );
}

function checkTheRulesSetLaysWiresUnderItsMarkers(check: CheckReporter): void {
  const rules = rulesOn(FLAT_GROUND, storeWithNodes(nodeOfType(WIRED_SCENE)));
  const markers = rules.markersIn(-5, -5, 5, 5);
  const lookup = pointOverlayLookup(emptySampler(), { originX: -5, originY: -5, columns: 11, rows: 11 }, rules);
  check(
    'the rules set draws the circuit wires beneath every overlay marker',
    markers.length === SCENE_CIRCUIT.wires.length + 1 && markers[markers.length - 1]!.tag.includes('crate'),
  );
  check(
    'a crate pushed onto a wire still reads as the crate on the ascii grid, and bare wire cells as circuit lines',
    lookup.get('1,0')!.tag.includes('crate') && lookup.get('2,1')!.tag.includes('circuit line'),
  );
  check(
    'the rules set gathers crates and circuits from its overlays for the cue watcher',
    rules.cratesIn(-5, -5, 5, 5).length === 1 && rules.circuitsIn(-5, -5, 5, 5)[0]?.key === 'scene',
  );
}

function checkCuesFireOnceForEachChange(check: CheckReporter): void {
  const scene = sceneWithOneCrate();
  const cues = new PuzzleCues(scene.source);
  const heard = listenTo(cues);
  cues.sync({ x: 0, y: 0 });
  check('the first look at a world is a silent baseline', heard.size === 0);
  scene.crates[0] = { x: 4, y: 3 };
  cues.sync({ x: 0, y: 0 });
  cues.sync({ x: 0, y: 0 });
  check(
    'a crate that moved fires one push cue at the cell it arrived on',
    heard.get('crate-pushed')?.length === 1 && cellKeyOf(heard.get('crate-pushed')![0]![0]!) === '4,3',
  );
  scene.circuit.plates[0]!.lit = true;
  cues.sync({ x: 0, y: 0 });
  scene.circuit.doors[0]!.open = true;
  scene.circuit.powered = true;
  cues.sync({ x: 0, y: 0 });
  check(
    'a plate lighting, a door opening and the circuit powering each fire once at their own cells',
    cellKeyOf(heard.get('plate-lit')![0]![0]!) === '5,5' &&
      cellKeyOf(heard.get('door-opened')![0]![0]!) === '8,5' &&
      cellKeyOf(heard.get('circuit-powered')![0]![0]!) === '8,5' &&
      ['plate-lit', 'door-opened', 'circuit-powered'].every((cue) => heard.get(cue as PuzzleCue)!.length === 1),
  );
  heard.clear();
  scene.crates[0] = { x: 12, y: 12 };
  cues.sync({ x: 0, y: 0 });
  check('a crate that jumps home on a room reset is not a push', heard.size === 0);
  heard.clear();
  cues.forget();
  scene.crates[0] = { x: 6, y: 3 };
  cues.sync({ x: 0, y: 0 });
  check('after forgetting, the next look is a silent baseline again', heard.size === 0);
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
  check('a crate that scrolls into earshot as the player walks is not a push', !heard.has('crate-pushed'));
  check('a circuit first seen already powered fires nothing', heard.size === 0);
}

function checkSoundsFollowTheWorld(check: CheckReporter): void {
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

function checkADoorLiftsIntoItsLintel(check: CheckReporter): void {
  const root = new THREE.Group();
  const doors = new DoorOpenings(root, () => 3, () => new THREE.MeshLambertMaterial());
  doors.open([{ x: 4, y: 7 }]);
  const leaf = root.children[0] as THREE.Mesh;
  const topOf = () => leaf.position.y + leaf.scale.y / 2;
  check(
    'a door that opens is covered by a full-height closed leaf standing on its cell',
    root.children.length === 1 && leaf.position.x === 4.5 && leaf.position.z === 7.5 && leaf.scale.y === DOOR_STANDS_TALL && topOf() === 3 + DOOR_STANDS_TALL,
  );
  doors.advance(DOOR_OPENING_SECONDS / 2);
  check(
    'halfway through, the leaf has shrunk upward while its top stays in the lintel',
    leaf.scale.y < DOOR_STANDS_TALL && leaf.scale.y > 0 && Math.abs(topOf() - (3 + DOOR_STANDS_TALL)) < 1e-9,
  );
  doors.advance(DOOR_OPENING_SECONDS);
  check('once lifted, the leaf is gone from the scene', root.children.length === 0);
  doors.open([{ x: 0, y: 0 }, { x: 1, y: 0 }]);
  doors.dispose();
  check('disposing drops every leaf still lifting', root.children.length === 0);
}

interface CueScene {
  crates: Cell[];
  circuit: Circuit;
  source: PuzzleSource;
}

function sceneWithOneCrate(): CueScene {
  const scene: CueScene = {
    crates: [{ x: 3, y: 3 }],
    circuit: {
      key: 'room',
      plates: [{ x: 5, y: 5, lit: false }],
      doors: [{ x: 8, y: 5, open: false }],
      wires: [],
      powered: false,
    },
    source: {
      circuitsIn: (minX, minY, maxX, maxY) =>
        [structuredClone(scene.circuit)].filter((circuit) => circuitTouches(circuit, minX, minY, maxX, maxY)),
      cratesIn: (minX, minY, maxX, maxY) => scene.crates.filter((cell) => cellWithin(cell, minX, minY, maxX, maxY)),
    },
  };
  return scene;
}

function listenTo(cues: PuzzleCues): Map<PuzzleCue, Cell[][]> {
  const heard = new Map<PuzzleCue, Cell[][]>();
  const every: PuzzleCue[] = ['crate-pushed', 'plate-lit', 'door-opened', 'circuit-powered'];
  for (const cue of every) cues.on(cue, (cells) => heard.set(cue, [...(heard.get(cue) ?? []), cells]));
  return heard;
}

function roomFloor(x: number, y: number): boolean {
  return x >= ROOM.minX && x <= ROOM.maxX && y >= ROOM.minY && y <= ROOM.maxY;
}

function emptySampler(): WorldSampler {
  return { markersIn: () => [], itemSpawnsIn: () => [] } as unknown as WorldSampler;
}
