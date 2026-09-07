import * as THREE from 'three';
import type { Marker } from '@/features/asset-library/worlds/worldSampler';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { fixtureLook } from '../fixtures/fixtureAppearance';
import { CRATE_STANDS_SQUAT } from '../fixtures/looks/crate';
import { CoveredCells } from '../render/view3d/animations/coveredCells';
import {
  CRATE_DROP_SECONDS,
  CRATE_SLIDE_SECONDS,
  CrateSlides,
} from '../render/view3d/animations/crateSlides';
import type { Cell } from '../worldRules';

const CRATE_CENTRE = CRATE_STANDS_SQUAT / 2;

export function checkCrateSlides(check: CheckReporter): void {
  checkAShoveCarriesTheCrateAcross(check);
  checkAShovedCrateSlidesOutBeforeItFalls(check);
  checkInterruptionsSnapTheCrateToTruth(check);
}

interface Bench {
  root: THREE.Group;
  slides: CrateSlides;
  covered: CoveredCells;
  remeshed: Cell[];
  crateAt(): THREE.Mesh | undefined;
}

function benchWithCratesAt(crates: readonly Cell[], groundAt: (x: number, y: number) => number): Bench {
  const remeshed: Cell[] = [];
  const covered = new CoveredCells((cell) => remeshed.push(cell));
  const markers: Marker[] = [
    ...crates.map((cell) => ({ ...cell, ...fixtureLook('crate', false) })),
    ...crates.map((cell) => ({ ...cell, ...fixtureLook('plate', false) })),
  ];
  const root = new THREE.Group();
  const slides = new CrateSlides(root, {
    crates: {
      markersIn: (minX, minY, maxX, maxY) =>
        markers.filter((one) => one.x >= minX && one.x <= maxX && one.y >= minY && one.y <= maxY),
    },
    covered,
    elevationAt: groundAt,
    crateMaterials: () => new THREE.MeshLambertMaterial(),
  });
  return { root, slides, covered, remeshed, crateAt: () => root.children[0] as THREE.Mesh | undefined };
}

function checkAShoveCarriesTheCrateAcross(check: CheckReporter): void {
  const bench = benchWithCratesAt([{ x: 5, y: 2 }], () => 0);
  bench.slides.shove([{ from: { x: 4, y: 2 }, to: { x: 5, y: 2 } }]);
  const mesh = bench.crateAt()!;
  check(
    'a shoved crate starts standing on the cell it left, drawn at the crate size',
    mesh.position.x === 4.5 &&
      mesh.position.z === 2.5 &&
      mesh.position.y === CRATE_CENTRE &&
      mesh.scale.y === CRATE_STANDS_SQUAT,
  );
  check(
    'the crate baked into the destination is hidden while its slide is drawn, and only the crate',
    bench.covered.hidesMarker({ ...fixtureLook('crate', false), x: 5, y: 2 }) &&
      !bench.covered.hidesMarker({ ...fixtureLook('plate', false), x: 5, y: 2 }) &&
      bench.remeshed.length === 1,
  );
  bench.slides.advance(CRATE_SLIDE_SECONDS * 0.1);
  const leadIn = mesh.position.x;
  check('the first tenth of the shove barely moves the crate, so it reads as heavy', leadIn > 4.5 && leadIn < 4.55);
  bench.slides.advance(CRATE_SLIDE_SECONDS * 0.4);
  check('halfway through the shove the crate is well along the slide', mesh.position.x > 4.9 && mesh.position.x < 5.3);
  bench.slides.advance(CRATE_SLIDE_SECONDS * 0.35);
  check('near the end the crate nudges past its cell before settling back', mesh.position.x > 5.5);
  bench.slides.advance(CRATE_SLIDE_SECONDS);
  check(
    'once the shove is spent the drawn crate is gone and the baked one is back',
    bench.root.children.length === 0 && !bench.covered.isCovered(5, 2) && bench.remeshed.length === 2,
  );
}

function checkAShovedCrateSlidesOutBeforeItFalls(check: CheckReporter): void {
  const bench = benchWithCratesAt([{ x: 5, y: 2 }], (x) => (x >= 5 ? 0 : 3));
  bench.slides.shove([{ from: { x: 4, y: 2 }, to: { x: 5, y: 2 } }]);
  const mesh = bench.crateAt()!;
  check('a crate about to fall starts on the ledge it is leaving', mesh.position.y === 3 + CRATE_CENTRE);
  bench.slides.advance(CRATE_SLIDE_SECONDS);
  check(
    'it is over its landing cell before it has fallen at all, so it never slides diagonally',
    Math.abs(mesh.position.x - 5.5) < 1e-9 && mesh.position.y === 3 + CRATE_CENTRE,
  );
  bench.slides.advance(CRATE_DROP_SECONDS / 2);
  check(
    'the drop starts gently and is still above the floor halfway down',
    mesh.position.y < 3 + CRATE_CENTRE && mesh.position.y > 2 + CRATE_CENTRE,
  );
  bench.slides.advance(CRATE_DROP_SECONDS);
  check('after the drop the crate is handed back to the world', bench.root.children.length === 0);
}

function checkInterruptionsSnapTheCrateToTruth(check: CheckReporter): void {
  const bench = benchWithCratesAt([{ x: 5, y: 2 }, { x: 6, y: 2 }], () => 0);
  bench.slides.shove([{ from: { x: 4, y: 2 }, to: { x: 5, y: 2 } }]);
  bench.slides.advance(CRATE_SLIDE_SECONDS * 0.3);
  bench.slides.shove([{ from: { x: 5, y: 2 }, to: { x: 6, y: 2 } }]);
  check(
    'a second shove of the same crate replaces the first rather than doubling it',
    bench.root.children.length === 1 && bench.crateAt()!.position.x === 5.5 && !bench.covered.isCovered(5, 2),
  );
  bench.slides.settle();
  check('a redraw in the same breath as the shove leaves the fresh slide running', bench.root.children.length === 1);
  bench.slides.advance(CRATE_SLIDE_SECONDS * 0.3);
  bench.slides.settle();
  check(
    'a reset snaps a crate mid-slide back to the truth the world holds',
    bench.root.children.length === 0 && !bench.covered.isCovered(6, 2),
  );
  bench.slides.shove([{ from: { x: 5, y: 2 }, to: { x: 6, y: 2 } }]);
  bench.slides.dispose();
  check(
    'disposing the view drops every crate still sliding',
    bench.root.children.length === 0 && !bench.covered.isCovered(6, 2),
  );
}
