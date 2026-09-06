import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { WIRE_EAST, WIRE_NORTH, WIRE_SOUTH, WIRE_WEST } from '@/features/asset-library/tiles/art/fixtures/circuitWireArt';
import { SIDE_FACES } from '@/features/asset-library/tiles/tileFaceArt';
import type { Marker, WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import { cellKeyOf, type Circuit } from '../circuits/circuit';
import { LIT_WIRE_GLOW, WIRE_LIES_FLAT, wireMarkersOf, wireMaskAt } from '../circuits/wireMarkers';
import { routeWires } from '../circuits/wireRoutes';
import { fixtureLook } from '../fixtures/fixtureAppearance';
import { pointOverlayLookup } from '../render/ascii/asciiCells';
import { registerWorldRules, rulesWithDefaults, type Cell } from '../worldRules';
import { wiresJoin } from './circuitFixtures';
import { FLAT_GROUND, nodeOfType, rulesOn, storeWithNodes } from './rulesFixtures';

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

export function checkCircuits(check: CheckReporter): void {
  checkWiresRouteFromPlatesToDoors(check);
  checkWireMarkersReadTheirJoins(check);
  checkTheRulesSetLaysWiresUnderItsMarkers(check);
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

function roomFloor(x: number, y: number): boolean {
  return x >= ROOM.minX && x <= ROOM.maxX && y >= ROOM.minY && y <= ROOM.maxY;
}

function emptySampler(): WorldSampler {
  return { markersIn: () => [], itemSpawnsIn: () => [] } as unknown as WorldSampler;
}
