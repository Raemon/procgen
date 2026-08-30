import { CUBE_FACES, type CubeFaceArt } from '@/features/asset-library/tiles/tileFaceArt';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { fixtureLook, type FixtureLook } from '../puzzles/fixtures/fixtureAppearance';
import { fixture } from '../puzzles/fixtures/puzzleFixture';
import type { PuzzleRoomLayout } from '../puzzles/rooms/puzzleRoomLayout';
import { fixtureIsOn } from '../puzzles/state/fixtureSignals';
import { PuzzleState } from '../puzzles/state/puzzleState';
import { markerPlacementsForRect } from '../render/view3d/markerPlacements';
import type { Marker, WorldSampler } from '@/features/asset-library/worlds/worldSampler';

const PLATE_CELL = { x: 4, y: 2 };
const CRATE_START = { x: 6, y: 2 };

export function checkSokobanFixtureArt(check: CheckReporter): void {
  checkEverySokobanFixtureIsPainted(check);
  checkAPlateReadsDifferentlyOnceWeighted(check);
  checkACrateSettledOnAPlateSaysSo(check);
  checkSokobanFixturesStandInTheWorldRatherThanAsPins(check);
  checkTheThreeSokobanPiecesAreToldApartAtAGlance(check);
}

function checkEverySokobanFixtureIsPainted(check: CheckReporter): void {
  for (const look of sokobanLooks()) {
    check(
      `${look.tag} carries face art rather than a blank block`,
      look.faceArt !== null && everyFaceIsFullyPainted(look.faceArt),
    );
  }
}

function checkAPlateReadsDifferentlyOnceWeighted(check: CheckReporter): void {
  const [waiting, weighted] = [fixtureLook('plate', false), fixtureLook('plate', true)];
  check(
    'a weighted plate changes colour and sinks under the crate that holds it',
    waiting.color !== weighted.color && weighted.standingHeight! < waiting.standingHeight!,
  );
  check(
    'a plate lies low enough to walk over rather than standing like a crate',
    waiting.standingHeight! < fixtureLook('crate', false).standingHeight!,
  );
}

function checkACrateSettledOnAPlateSaysSo(check: CheckReporter): void {
  const layout = roomWithOnePlateAndOneCrate();
  const state = new PuzzleState();
  const crate = layout.fixtures.find((one) => one.kind === 'crate')!;
  const plate = layout.fixtures.find((one) => one.kind === 'plate')!;
  check(
    'a crate away from its plate reads as still loose',
    !fixtureIsOn(layout, state, crate) && !fixtureIsOn(layout, state, plate),
  );
  state.moveCrate(`${layout.key}/${crate.id}`, PLATE_CELL);
  check(
    'a crate pushed onto a plate reads as settled, and the plate as weighted',
    fixtureIsOn(layout, state, crate) && fixtureIsOn(layout, state, plate),
  );
  check(
    'a settled crate is painted differently from a loose one',
    fixtureLook('crate', true).faceArt !== fixtureLook('crate', false).faceArt,
  );
}

function checkSokobanFixturesStandInTheWorldRatherThanAsPins(check: CheckReporter): void {
  const markers = sokobanLooks().map((look, index) => ({ x: index, y: 0, ...look }) as Marker);
  const placements = markerPlacementsForRect(samplerOfMarkers(markers), 0, 0, markers.length, 1);
  check(
    'every sokoban fixture is drawn as a standing fixture, not a floating pin',
    placements.standingFixtures.length === markers.length && placements.pins.length === 0,
  );
}

function checkTheThreeSokobanPiecesAreToldApartAtAGlance(check: CheckReporter): void {
  const [plate, crate, pillar] = [
    fixtureLook('plate', false),
    fixtureLook('crate', false),
    fixtureLook('pillar', false),
  ];
  check(
    'plate, crate and pillar each take their own colour and glyph',
    new Set([plate.color, crate.color, pillar.color]).size === 3 &&
      new Set([plate.glyph, crate.glyph, pillar.glyph]).size === 3,
  );
  check(
    'the pillar that cannot be pushed stands taller than the crate that can',
    pillar.standingHeight! > crate.standingHeight!,
  );
}

function sokobanLooks(): FixtureLook[] {
  return [
    fixtureLook('plate', false),
    fixtureLook('plate', true),
    fixtureLook('crate', false),
    fixtureLook('crate', true),
    fixtureLook('pillar', false),
  ];
}

function everyFaceIsFullyPainted(art: CubeFaceArt): boolean {
  return CUBE_FACES.every((face) => art[face].every((ink) => ink !== null));
}

function roomWithOnePlateAndOneCrate(): PuzzleRoomLayout {
  return {
    roomX: 0,
    roomY: 0,
    key: 'room',
    interior: { x: 0, y: 0, width: 8, height: 8 },
    kindName: 'sokoban',
    level: 1,
    entrance: { x: 0, y: 0 },
    fixtures: [fixture('plate0', 'plate', PLATE_CELL), fixture('crate0', 'crate', CRATE_START)],
    gates: { east: [], south: [], west: [], north: [] },
    opensWhen: ['plate0'],
    solution: [],
  };
}

function samplerOfMarkers(markers: readonly Marker[]): WorldSampler {
  return {
    elevationAt: () => 0,
    markersIn: () => [...markers],
  } as unknown as WorldSampler;
}
