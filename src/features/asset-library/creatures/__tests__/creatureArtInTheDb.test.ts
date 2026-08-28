import { readFileSync } from 'node:fs';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { billboardFigureExtent } from '../../characters/billboardFigureExtent';
import {
  CHARACTER_ANIMATIONS,
  CHARACTER_ROTATIONS,
  framesOf,
  type CharacterBillboard,
} from '../../characters/characterBillboard';
import { GAUNT_ONE_ART, MOONLIT_DWARF_ART } from '../../characters/billboardArtNames';
import {
  billboardFromCompact,
  compactBillboardOf,
  isCompactCharacterBillboard,
} from '../../characters/storage/compactCharacterBillboard';
import { creaturesAsStoredJson, creaturesFromStoredJson } from '../creatureStorage';
import type { CreatureDef } from '../creatureDef';

const WALK_KEYFRAMES = 8;

export function checkCreatureArtInTheDb(check: CheckReporter): void {
  const shipped = JSON.parse(readFileSync('data/creatures.json', 'utf8')) as unknown[];
  const creatures = creaturesFromStoredJson(shipped) ?? [];
  const painted = creatures.filter((creature) => creature.billboardArt !== null);

  check(
    'the shipped creature art is stored compacted, not as raw pixel arrays',
    everyStoredBillboardIsCompact(shipped),
  );
  check(
    'every creature naming built-in art carries that art as frames from the data file',
    painted.length >= 4 && painted.every((creature) => creature.billboard !== null),
  );
  check(
    'stored art decodes to a full set of frames on all five rotations',
    painted.every((creature) => hasEveryRotation(creature.billboard!)),
  );
  check(
    'the gaunt one walks on eight keyframes in every rotation',
    walkKeyframesOf(painted, GAUNT_ONE_ART) === WALK_KEYFRAMES,
  );
  check(
    'the gaunt one looms taller than it is wide, so it reads as a 2-unit-tall creature',
    loomsTall(artNamed(painted, GAUNT_ONE_ART)),
  );
  check(
    'the downscaled dwarf still carries every frame the player character animates',
    frameCountOf(artNamed(painted, MOONLIT_DWARF_ART)) === 70,
  );
  check(
    'compacting art and reading it back yields the very same frames',
    painted.every(roundTripsExactly),
  );
  check(
    'stored art stays inside one byte per pixel, so the data file cannot balloon',
    everyPaletteFitsOneByte(shipped),
  );
  check(
    'writing the creatures back out keeps every billboard compacted',
    everyStoredBillboardIsCompact(creaturesAsStoredJson(creatures) as unknown[]),
  );
}

function artNamed(creatures: readonly CreatureDef[], art: string): CharacterBillboard | null {
  return creatures.find((creature) => creature.billboardArt === art)?.billboard ?? null;
}

function everyStoredBillboardIsCompact(rows: readonly unknown[]): boolean {
  return rows.every((row) => {
    const billboard = (row as { billboard?: unknown }).billboard;
    return billboard === null || billboard === undefined || isCompactCharacterBillboard(billboard);
  });
}

function everyPaletteFitsOneByte(rows: readonly unknown[]): boolean {
  return rows.every((row) => {
    const billboard = (row as { billboard?: unknown }).billboard;
    if (!isCompactCharacterBillboard(billboard)) return true;
    return billboard.palette.length <= 255;
  });
}

function hasEveryRotation(billboard: CharacterBillboard): boolean {
  return CHARACTER_ROTATIONS.every((rotation) =>
    CHARACTER_ANIMATIONS.every((animation) => framesOf(billboard, rotation, animation).length > 0),
  );
}

function walkKeyframesOf(creatures: readonly CreatureDef[], art: string): number {
  const billboard = artNamed(creatures, art);
  if (!billboard) return 0;
  const counts = new Set(
    CHARACTER_ROTATIONS.map((rotation) => framesOf(billboard, rotation, 'moving').length),
  );
  return counts.size === 1 ? [...counts][0]! : 0;
}

function frameCountOf(billboard: CharacterBillboard | null): number {
  if (!billboard) return 0;
  return CHARACTER_ROTATIONS.reduce(
    (total, rotation) =>
      total +
      CHARACTER_ANIMATIONS.reduce(
        (perRotation, animation) => perRotation + framesOf(billboard, rotation, animation).length,
        0,
      ),
    0,
  );
}

function loomsTall(billboard: CharacterBillboard | null): boolean {
  if (!billboard) return false;
  const extent = billboardFigureExtent(billboard);
  return extent !== null && extent.heightCells > extent.widthCells && extent.heightCells >= 40;
}

function roundTripsExactly(creature: CreatureDef): boolean {
  const compacted = compactBillboardOf(creature.billboard!);
  if (!compacted) return false;
  return JSON.stringify(billboardFromCompact(compacted)) === JSON.stringify(creature.billboard);
}
