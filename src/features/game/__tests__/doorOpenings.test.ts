import * as THREE from 'three';
import type { Marker, WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { fixtureLook, gateLook } from '../fixtures/fixtureAppearance';
import { CoveredCells } from '../render/view3d/animations/coveredCells';
import {
  DOOR_OPENING_SECONDS,
  DoorOpenings,
  easedGateSlide,
} from '../render/view3d/animations/doorOpenings';
import { gateKeyAt } from '../render/view3d/gateMeshes';
import { markerPlacementsForRect } from '../render/view3d/markerPlacements';
import {
  GRILLE_HEIGHT,
  GRILLE_TRAVEL,
  portcullisGrilleBoxes,
} from '../render/view3d/portcullisBoxes';
import type { Cell } from '../worldRules';

const GATE = gateKeyAt(0, 0);
const FRAMES_ACROSS_THE_SLIDE = 24;
const FAR_ENOUGH_TO_SEE_EVERY_GATE = 8;

export function checkDoorOpenings(check: CheckReporter): void {
  checkAGateIsDrawnAsAPortcullisRatherThanASlab(check);
  checkAGateFirstSeenOpenNeverPlaysItsSlide(check);
  checkAGateSlidesAllTheWayDownAcrossItsOpeningSeconds(check);
  checkTheSlideEasesInAndOut(check);
  checkAGateThatShutsRunsTheSlideBackwards(check);
  checkAnOpenGrilleEndsBelowTheFloor(check);
  checkACoveredCellHidesItsMarker(check);
}

function checkAGateIsDrawnAsAPortcullisRatherThanASlab(check: CheckReporter): void {
  const placements = markerPlacementsForRect(samplerOfMarkers(bothGateMarkers()), 0, 0, 4, 1);
  check(
    'a gate is drawn as a sliding portcullis rather than a standing slab',
    placements.slidingGates.length === 2 && placements.standingFixtures.length === 0,
  );
  check(
    'a portcullis grille is bars and rails you can see between, not one solid box',
    portcullisGrilleBoxes().length > 4 &&
      portcullisGrilleBoxes().every((box) => box.width < 1 && box.depth < 0.2),
  );
}

function checkAGateFirstSeenOpenNeverPlaysItsSlide(check: CheckReporter): void {
  const openings = openingsOver(oneGateMarker(1));
  check('a gate already open when first seen stands open', openings.slideOf(GATE) === 1);
}

function checkAGateSlidesAllTheWayDownAcrossItsOpeningSeconds(check: CheckReporter): void {
  const slides = slideOverTime(0, 1);
  check('a shut gate starts with its grille filling the doorway', slides[0] === 0);
  check(
    'the grille is partway down halfway through the opening',
    slides[middleFrame()]! > 0.2 && slides[middleFrame()]! < 0.8,
  );
  check(
    'the grille never jumps outside its travel',
    slides.every((slide) => slide >= 0 && slide <= 1),
  );
  check('the grille only ever goes further down while opening', risesMonotonically(slides));
  check('the grille is fully down once the opening seconds have passed', slides.at(-1) === 1);
}

function checkTheSlideEasesInAndOut(check: CheckReporter): void {
  check(
    'the grille creeps at the start and end of its travel rather than snapping',
    easedGateSlide(0.1) < 0.1 && easedGateSlide(0.9) > 0.9,
  );
  check('the grille runs fastest across the middle of its travel', easedGateSlide(0.5) === 0.5);
}

function checkAGateThatShutsRunsTheSlideBackwards(check: CheckReporter): void {
  const slides = slideOverTime(1, 0);
  check(
    'a gate told to shut climbs back out of the floor',
    risesMonotonically(slides.map((slide) => 1 - slide)),
  );
  check('a shut gate ends filling its doorway again', slides.at(-1) === 0);
}

function checkAnOpenGrilleEndsBelowTheFloor(check: CheckReporter): void {
  check('an open grille has sunk out of sight under the floor', GRILLE_HEIGHT - GRILLE_TRAVEL <= 0);
  check(
    'a shut grille reaches from the floor up to the lintel',
    GRILLE_TRAVEL === GRILLE_HEIGHT && GRILLE_HEIGHT > 1.5,
  );
}

function checkACoveredCellHidesItsMarker(check: CheckReporter): void {
  const remeshed: Cell[] = [];
  const covered = new CoveredCells((cell) => remeshed.push(cell));
  const crate = { x: 4, y: 7, ...fixtureLook('crate', false) };
  const plate = { x: 5, y: 7, ...fixtureLook('plate', false) };
  const world = { markersIn: (): Marker[] => [crate, plate] };
  const shown = covered.markersExcept(world);
  check('an uncovered world hands back every marker it has', shown.markersIn(0, 0, 9, 9).length === 2);
  const uncover = covered.cover({ x: 4, y: 7 });
  check(
    'covering a cell hides the marker baked there and asks for that chunk again',
    shown.markersIn(0, 0, 9, 9).length === 1 && shown.markersIn(0, 0, 9, 9)[0] === plate && remeshed.length === 1,
  );
  const alsoUncover = covered.cover({ x: 4, y: 7 });
  uncover();
  check('a cell two animations cover stays hidden until the last of them lets go', covered.isCovered(4, 7));
  alsoUncover();
  alsoUncover();
  check(
    'once every cover is lifted the marker is back and the chunk was asked for once more',
    shown.markersIn(0, 0, 9, 9).length === 2 && !covered.isCovered(4, 7) && remeshed.length === 2,
  );
}

function slideOverTime(from: number, to: number): number[] {
  const gate = oneGateMarker(from);
  const openings = openingsOver(gate);
  gate.gateOpenness = to;
  openings.invalidate();
  openings.showAround(0, 0, FAR_ENOUGH_TO_SEE_EVERY_GATE);
  const slides = [openings.slideOf(GATE)];
  for (let frame = 0; frame <= FRAMES_ACROSS_THE_SLIDE; frame++) {
    openings.advance(DOOR_OPENING_SECONDS / FRAMES_ACROSS_THE_SLIDE);
    slides.push(openings.slideOf(GATE));
  }
  return slides;
}

function openingsOver(gate: Marker): DoorOpenings {
  const openings = new DoorOpenings(new THREE.Group(), samplerOfMarkers([gate]), {
    markersIn: () => [],
  });
  openings.showAround(0, 0, FAR_ENOUGH_TO_SEE_EVERY_GATE);
  return openings;
}

function middleFrame(): number {
  return FRAMES_ACROSS_THE_SLIDE / 2;
}

function risesMonotonically(values: readonly number[]): boolean {
  return values.every((value, at) => at === 0 || value >= values[at - 1]!);
}

function oneGateMarker(openness: number): Marker {
  return { x: 0, y: 0, ...gateLook('mechanism', openness === 1) };
}

function bothGateMarkers(): Marker[] {
  return [
    { x: 0, y: 0, ...gateLook('mechanism', false) },
    { x: 1, y: 0, ...gateLook('mechanism', true) },
  ];
}

function samplerOfMarkers(markers: readonly Marker[]): WorldSampler {
  return {
    elevationAt: () => 0,
    markersIn: () => [...markers],
  } as unknown as WorldSampler;
}
