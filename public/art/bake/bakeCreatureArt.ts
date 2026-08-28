import { readFileSync, writeFileSync } from 'node:fs';
import {
  CHARACTER_ANIMATIONS,
  CHARACTER_ROTATIONS,
  framesOf,
  type CharacterBillboard,
} from '@/features/asset-library/characters/characterBillboard';
import {
  creaturesAsStoredJson,
  creaturesFromStoredJson,
} from '@/features/asset-library/creatures/creatureStorage';
import { paintedArtNamed } from '../artCatalog';
import { quantizedBillboard } from './quantizeBillboard';
import { resampledSprite } from './resampleSprite';

const DATA_PATH = 'data/creatures.json';
const MAX_STORED_COLORS = 255;
const BAKE_SIZES: Readonly<Record<string, number>> = { 'moonlit-dwarf': 48 };

const creatures = creaturesFromStoredJson(JSON.parse(readFileSync(DATA_PATH, 'utf8')));
if (!creatures) throw new Error(`${DATA_PATH} holds no creatures to bake art onto`);

const baked = creatures.map((creature) => {
  if (!creature.billboardArt) return creature;
  const painted = paintedArtNamed(creature.billboardArt);
  if (!painted) throw new Error(`no art is painted for "${creature.billboardArt}"`);
  const billboard = storableBillboard(painted, BAKE_SIZES[creature.billboardArt]);
  console.log(`  ${creature.name} <- ${creature.billboardArt} ${describe(billboard)}`);
  return { ...creature, billboard };
});

const json = `${JSON.stringify(creaturesAsStoredJson(baked), null, 2)}\n`;
writeFileSync(DATA_PATH, json);
console.log(`wrote ${baked.length} creatures to ${DATA_PATH} (${(json.length / 1024).toFixed(0)} KB)`);

function storableBillboard(painted: CharacterBillboard, size: number | undefined): CharacterBillboard {
  const resized = size === undefined ? painted : resizedBillboard(painted, size);
  return quantizedBillboard(resized, MAX_STORED_COLORS);
}

function resizedBillboard(billboard: CharacterBillboard, size: number): CharacterBillboard {
  const clips = {} as CharacterBillboard['clips'];
  for (const rotation of CHARACTER_ROTATIONS) {
    clips[rotation] = { idle: [], moving: [] };
    for (const animation of CHARACTER_ANIMATIONS) {
      clips[rotation][animation] = framesOf(billboard, rotation, animation).map((frame) =>
        resampledSprite(frame, size),
      );
    }
  }
  return { idleFps: billboard.idleFps, movingFps: billboard.movingFps, clips };
}

function describe(billboard: CharacterBillboard): string {
  const frames = CHARACTER_ROTATIONS.flatMap((rotation) =>
    CHARACTER_ANIMATIONS.flatMap((animation) => framesOf(billboard, rotation, animation)),
  );
  const colors = new Set(frames.flatMap((frame) => frame.filter((pixel) => pixel !== null)));
  const grid = Math.round(Math.sqrt(frames[0]?.length ?? 0));
  return `${frames.length} frames @ ${grid}px, ${colors.size} colors`;
}
