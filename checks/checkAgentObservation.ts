import { Vector3 } from 'three';
import { buildObservation, GOD_VIEW_SIZE, SELF_GLYPH } from '../agents/observation';
import { observationText } from '../agents/observationText';
import { facingRelativeStep } from '../world/input/facingRelativeStep';
import {
  facingVector,
  facingYawRadians,
  isInFrontHalfPlane,
  turnedFacing,
  type FacingIndex,
} from '../world/facing';
import {
  DEFAULT_CHARACTER_SIGHT_RADIUS_TILES,
  MAX_CHARACTER_SIGHT_RADIUS_TILES,
  MIN_CHARACTER_SIGHT_RADIUS_TILES,
  characterViewSize,
  clampSightRadiusTiles,
  hazeStartTiles,
  isWithinCharacterSight,
} from '../world/vision/characterSight';
import { CharacterCamera } from '../world/render/view3d/characterCamera';
import { createCharacterFog } from '../world/render/view3d/worldScene';
import type { CheckReporter } from './checkReporter';
import { islandsState, tileAssets, worldFromState } from './pipelineWorldFixtures';

const CHARACTER_VIEW_SIZE_AT_DEFAULT_SIGHT = characterViewSize();

function firstPersonCamera(
  x = 0,
  y = 0,
  elevation = 0,
  facing: FacingIndex = 0,
): CharacterCamera {
  const camera = new CharacterCamera();
  camera.update(0, x, y, elevation, facingYawRadians(facing));
  return camera;
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function checkAgentObservation(check: CheckReporter): void {
  const agentWorld = worldFromState(islandsState());
  const godObs = buildObservation(agentWorld.sampler, tileAssets, { x: 0, y: 0, facing: 0 }, 'god');
  check('god observation grid is GOD_VIEW_SIZE² with @ at the center', (() => {
    const center = Math.floor(GOD_VIEW_SIZE / 2);
    return (
      godObs.view.length === GOD_VIEW_SIZE &&
      godObs.view.every((row) => row.length === GOD_VIEW_SIZE) &&
      godObs.view[center]![center] === SELF_GLYPH
    );
  })());
  check('god observation states its facing', godObs.facing === 'north');

  const charObs = buildObservation(agentWorld.sampler, tileAssets, { x: 0, y: 0, facing: 0 }, 'character');
  check('character observation never states a facing', charObs.facing === null);
  check('character observation blanks everything behind the agent', (() => {
    const center = Math.floor(CHARACTER_VIEW_SIZE_AT_DEFAULT_SIGHT / 2);
    for (let row = 0; row < CHARACTER_VIEW_SIZE_AT_DEFAULT_SIGHT; row++) {
      for (let column = 0; column < CHARACTER_VIEW_SIZE_AT_DEFAULT_SIGHT; column++) {
        const behind = !isInFrontHalfPlane(0, column - center, row - center);
        const isSelf = row === center && column === center;
        if (behind && !isSelf && charObs.view[row]![column] !== ' ') return false;
      }
    }
    return true;
  })());
  check('the character view grid is exactly wide enough to hold the sight radius', CHARACTER_VIEW_SIZE_AT_DEFAULT_SIGHT === DEFAULT_CHARACTER_SIGHT_RADIUS_TILES * 2 + 1);
  check('the 2.5D fog turns opaque exactly at the sight radius', (() => {
    const fog = createCharacterFog();
    return fog.far === DEFAULT_CHARACTER_SIGHT_RADIUS_TILES && fog.near === hazeStartTiles();
  })());
  check('the character camera renders nothing past the fog', firstPersonCamera().camera.far === DEFAULT_CHARACTER_SIGHT_RADIUS_TILES);
  check('the character camera stands in the player tile, so nothing behind the player can reach the screen', (() => {
    const camera = firstPersonCamera(3, 7, 2);
    const eye = camera.camera.position;
    return eye.x === 3.5 && eye.z === 7.5 && eye.y > 2 && eye.y < 2 + 2;
  })());
  check('the character camera looks along the facing it is given', (() => {
    const forward = new Vector3();
    const seen = new Set<string>();
    for (let facing = 0; facing < 8; facing++) {
      firstPersonCamera(0, 0, 0, facing as FacingIndex).camera.getWorldDirection(forward);
      const step = facingVector(facing as FacingIndex);
      if (Math.sign(round(forward.x)) !== step.dx || Math.sign(round(forward.z)) !== step.dy) {
        return false;
      }
      if (forward.y >= 0) return false;
      seen.add(`${round(forward.x)},${round(forward.z)}`);
    }
    return seen.size === 8;
  })());
  check('character observation blanks every tile the fog would swallow', (() => {
    const center = Math.floor(CHARACTER_VIEW_SIZE_AT_DEFAULT_SIGHT / 2);
    for (let row = 0; row < CHARACTER_VIEW_SIZE_AT_DEFAULT_SIGHT; row++) {
      for (let column = 0; column < CHARACTER_VIEW_SIZE_AT_DEFAULT_SIGHT; column++) {
        const dx = column - center;
        const dy = row - center;
        const isSelf = dx === 0 && dy === 0;
        const fogged = dx * dx + dy * dy > DEFAULT_CHARACTER_SIGHT_RADIUS_TILES * DEFAULT_CHARACTER_SIGHT_RADIUS_TILES;
        if (fogged && !isSelf && charObs.view[row]![column] !== ' ') return false;
      }
    }
    return true;
  })());
  check('the character sight test is the half-plane test bounded by the sight radius', (() => {
    for (let facing = 0; facing < 8; facing++) {
      for (let dy = -CHARACTER_VIEW_SIZE_AT_DEFAULT_SIGHT; dy <= CHARACTER_VIEW_SIZE_AT_DEFAULT_SIGHT; dy++) {
        for (let dx = -CHARACTER_VIEW_SIZE_AT_DEFAULT_SIGHT; dx <= CHARACTER_VIEW_SIZE_AT_DEFAULT_SIGHT; dx++) {
          const expected =
            isInFrontHalfPlane(facing as FacingIndex, dx, dy) &&
            dx * dx + dy * dy <= DEFAULT_CHARACTER_SIGHT_RADIUS_TILES * DEFAULT_CHARACTER_SIGHT_RADIUS_TILES;
          if (isWithinCharacterSight(facing as FacingIndex, dx, dy) !== expected) return false;
        }
      }
    }
    return true;
  })());
  check('a character observation stays smaller to read than a god observation', CHARACTER_VIEW_SIZE_AT_DEFAULT_SIGHT < GOD_VIEW_SIZE);
  check('the character observation states its sight radius, the god one has none', charObs.sightRadiusTiles === DEFAULT_CHARACTER_SIGHT_RADIUS_TILES && godObs.sightRadiusTiles === null);
  check('the character observation text names the sight radius', observationText(charObs).includes(`${DEFAULT_CHARACTER_SIGHT_RADIUS_TILES} tiles`));
  check('every facing rotates the blank half of the character view', (() => {
    const center = Math.floor(CHARACTER_VIEW_SIZE_AT_DEFAULT_SIGHT / 2);
    const views = new Set<string>();
    for (let facing = 0; facing < 8; facing++) {
      const obs = buildObservation(
        agentWorld.sampler,
        tileAssets,
        { x: 0, y: 0, facing: facing as FacingIndex },
        'character',
      );
      views.add(obs.view.join('\n'));
      for (let row = 0; row < CHARACTER_VIEW_SIZE_AT_DEFAULT_SIGHT; row++) {
        for (let column = 0; column < CHARACTER_VIEW_SIZE_AT_DEFAULT_SIGHT; column++) {
          const visible = isWithinCharacterSight(facing as FacingIndex, column - center, row - center);
          if (!visible && !(row === center && column === center) && obs.view[row]![column] !== ' ') {
            return false;
          }
        }
      }
    }
    return views.size === 8;
  })());
  check('character legend appears only for visible glyphs plus the fixed entries', charObs.legend.every((entry) => entry.glyph === '@' || entry.glyph === ' ' || charObs.view.some((row) => row.includes(entry.glyph))));

  const WIDE_SIGHT_RADIUS = 24;
  const wideObs = buildObservation(agentWorld.sampler, tileAssets, { x: 0, y: 0, facing: 0 }, 'character', WIDE_SIGHT_RADIUS);
  check('a widened sight radius widens the observation grid to match', wideObs.viewSize === characterViewSize(WIDE_SIGHT_RADIUS) && wideObs.view.length === wideObs.viewSize && wideObs.view.every((row) => row.length === wideObs.viewSize));
  check('a widened observation reports the radius it was built with', wideObs.sightRadiusTiles === WIDE_SIGHT_RADIUS && observationText(wideObs).includes(`${WIDE_SIGHT_RADIUS} tiles`));
  check('a widened sight radius still blanks everything behind and past the fog', (() => {
    const center = Math.floor(wideObs.viewSize / 2);
    for (let row = 0; row < wideObs.viewSize; row++) {
      for (let column = 0; column < wideObs.viewSize; column++) {
        const dx = column - center;
        const dy = row - center;
        if (dx === 0 && dy === 0) continue;
        const visible = isWithinCharacterSight(0, dx, dy, WIDE_SIGHT_RADIUS);
        if (!visible && wideObs.view[row]![column] !== ' ') return false;
      }
    }
    return true;
  })());
  check('a wider radius only adds ground: every tile the default radius showed reads the same', (() => {
    const wideCenter = Math.floor(wideObs.viewSize / 2);
    const nearCenter = Math.floor(CHARACTER_VIEW_SIZE_AT_DEFAULT_SIGHT / 2);
    let widened = false;
    for (let row = 0; row < CHARACTER_VIEW_SIZE_AT_DEFAULT_SIGHT; row++) {
      for (let column = 0; column < CHARACTER_VIEW_SIZE_AT_DEFAULT_SIGHT; column++) {
        const near = charObs.view[row]![column]!;
        const wide = wideObs.view[row - nearCenter + wideCenter]![column - nearCenter + wideCenter]!;
        if (near !== ' ' && near !== wide) return false;
        if (near === ' ' && wide !== ' ') widened = true;
      }
    }
    return widened;
  })());
  check('sight radii are clamped into the range the docs promise', clampSightRadiusTiles(0) === MIN_CHARACTER_SIGHT_RADIUS_TILES && clampSightRadiusTiles(1000) === MAX_CHARACTER_SIGHT_RADIUS_TILES && clampSightRadiusTiles(Number.NaN) === DEFAULT_CHARACTER_SIGHT_RADIUS_TILES && clampSightRadiusTiles(WIDE_SIGHT_RADIUS) === WIDE_SIGHT_RADIUS);
  check('the default radius is inside the range agents may ask for', DEFAULT_CHARACTER_SIGHT_RADIUS_TILES >= MIN_CHARACTER_SIGHT_RADIUS_TILES && DEFAULT_CHARACTER_SIGHT_RADIUS_TILES <= MAX_CHARACTER_SIGHT_RADIUS_TILES);
  check('the 2.5D fog and camera follow a widened sight radius', (() => {
    const fog = createCharacterFog(WIDE_SIGHT_RADIUS);
    const camera = firstPersonCamera();
    camera.setSightRadiusTiles(WIDE_SIGHT_RADIUS);
    return (
      fog.far === WIDE_SIGHT_RADIUS &&
      fog.near === hazeStartTiles(WIDE_SIGHT_RADIUS) &&
      fog.near < fog.far &&
      camera.camera.far === WIDE_SIGHT_RADIUS
    );
  })());
  check('haze always starts before the fog closes, at every radius agents may pick', (() => {
    for (let radius = MIN_CHARACTER_SIGHT_RADIUS_TILES; radius <= MAX_CHARACTER_SIGHT_RADIUS_TILES; radius++) {
      if (!(hazeStartTiles(radius) > 0 && hazeStartTiles(radius) < radius)) return false;
    }
    return true;
  })());
  check('turning wraps in eighth turns', turnedFacing(7, 1) === 0 && turnedFacing(0, -1) === 7);
  check('facing-relative steps never exceed one tile per axis', (() => {
    for (let facing = 0; facing < 8; facing++) {
      for (const forward of [-1, 0, 1]) {
        for (const strafe of [-1, 0, 1]) {
          const [dx, dy] = facingRelativeStep(facing as FacingIndex, forward, strafe);
          if (Math.abs(dx) > 1 || Math.abs(dy) > 1) return false;
        }
      }
    }
    return true;
  })());
  check('observation text and json carry the same grid', observationText(charObs).includes(charObs.view.join('\n')));
}
