import { readFileSync, writeFileSync } from 'node:fs';
import {
  CHARACTER_ANIMATIONS,
  CHARACTER_ROTATIONS,
  framesOf,
  fpsOf,
  type CharacterAnimation,
  type CharacterBillboard,
} from '@/features/asset-library/characters/characterBillboard';
import { spriteGridSize, type SpriteArt } from '@/features/asset-library/tiles/spriteArt';
import { creaturesFromStoredJson } from '@/features/asset-library/creatures/creatureStorage';
import { MOONLIT_DWARF_ART } from '@/features/asset-library/characters/billboardArtNames';
import { dwarfBillboard } from '../dwarf/dwarfBillboard';

const OUTPUT_PATH = 'public/art/preview/creatureArt.html';

const creatures = (creaturesFromStoredJson(JSON.parse(readFileSync('data/creatures.json', 'utf8'))) ?? [])
  .filter((creature) => creature.billboard !== null);

const painterly = dwarfBillboard();
const stored = creatures.find((creature) => creature.billboardArt === MOONLIT_DWARF_ART)?.billboard;

const sections = [
  card(
    'moonlit dwarf — painted at 128px (authoring)',
    frameOf(painterly, 'moving', 2),
    `${spriteGridSize(frameOf(painterly, 'moving', 2))}px source`,
  ),
  stored
    ? card(
        'moonlit dwarf — stored in the db at 48px',
        frameOf(stored, 'moving', 2),
        `${spriteGridSize(frameOf(stored, 'moving', 2))}px, palette-quantized`,
      )
    : '',
  ...creatures.map((creature) =>
    card(
      `${creature.name} — from the db`,
      frameOf(creature.billboard!, 'moving', 0),
      `${creature.billboardArt} · ${countFrames(creature.billboard!)} frames`,
    ),
  ),
].join('\n');

const strips = creatures
  .map((creature) => animatedStrip(creature.name, creature.billboard!))
  .join('\n');

writeFileSync(OUTPUT_PATH, page(sections, strips));
console.log(`wrote ${OUTPUT_PATH}`);

function frameOf(billboard: CharacterBillboard, animation: CharacterAnimation, index: number): SpriteArt {
  const frames = framesOf(billboard, 'frontQuarter', animation);
  return frames[index % Math.max(1, frames.length)] ?? frames[0]!;
}

function countFrames(billboard: CharacterBillboard): number {
  return CHARACTER_ROTATIONS.reduce(
    (total, rotation) =>
      total +
      CHARACTER_ANIMATIONS.reduce((n, a) => n + framesOf(billboard, rotation, a).length, 0),
    0,
  );
}

function svgOf(art: SpriteArt, scale: number): string {
  const size = spriteGridSize(art);
  const rects: string[] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const color = art[y * size + x];
      if (!color) continue;
      rects.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${color}"/>`);
    }
  }
  return `<svg viewBox="0 0 ${size} ${size}" width="${size * scale}" height="${size * scale}" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">${rects.join('')}</svg>`;
}

function card(title: string, art: SpriteArt, note: string): string {
  const scale = Math.max(2, Math.round(288 / spriteGridSize(art)));
  return `<section class="card"><h2>${title}</h2><div class="stage">${svgOf(art, scale)}</div><p>${note}</p></section>`;
}

function animatedStrip(name: string, billboard: CharacterBillboard): string {
  const cells = CHARACTER_ROTATIONS.map((rotation) => {
    const frames = framesOf(billboard, rotation, 'moving');
    const svgs = frames
      .map((frame, i) => `<div class="frame${i === 0 ? ' on' : ''}">${svgOf(frame, 4)}</div>`)
      .join('');
    return `<div class="cell" data-fps="${fpsOf(billboard, 'moving')}"><div class="stage">${svgs}</div><p>${rotation}</p></div>`;
  }).join('');
  return `<h3>${name} — walking</h3><div class="strip">${cells}</div>`;
}

function page(sections: string, strips: string): string {
  return `<title>Creature art — as stored in the db</title>
<style>
  body { background:#0b0d12; color:#cfd3de; font-family:ui-monospace,Menlo,monospace; margin:0; padding:28px; }
  h1 { font-size:18px; color:#e8eaf2; margin:0 0 4px; }
  .sub { color:#79808f; font-size:12.5px; margin:0 0 24px; }
  h2 { font-size:13px; font-weight:600; margin:0 0 10px; color:#dfe3ee; }
  h3 { font-size:13px; color:#dfe3ee; margin:26px 0 10px; }
  .grid { display:flex; flex-wrap:wrap; gap:16px; }
  .card { background:#10131b; border:1px solid #1e2330; border-radius:10px; padding:16px; }
  .card p { margin:8px 0 0; font-size:11.5px; color:#99a0b0; }
  .stage { position:relative; display:grid; place-items:center; background:radial-gradient(ellipse at 50% 30%,#161b28 0%,#0a0c11 75%); border-radius:8px; padding:8px; }
  .strip { display:flex; gap:12px; flex-wrap:wrap; }
  .cell { background:#10131b; border:1px solid #1e2330; border-radius:8px; padding:10px; }
  .cell p { margin:6px 0 0; font-size:11px; color:#99a0b0; text-align:center; }
  .cell .stage { width:192px; height:192px; }
  .frame { position:absolute; inset:0; display:none; place-items:center; }
  .frame.on { display:grid; }
</style>
<h1>Creature art, as it now lives in the database</h1>
<p class="sub">Every frame below was decoded from data/creatures.json. The authoring generators live in public/art/ and only run when you re-bake.</p>
<div class="grid">${sections}</div>
${strips}
<script>
for (const cell of document.querySelectorAll('.cell')) {
  const frames = cell.querySelectorAll('.frame');
  if (frames.length < 2) continue;
  let index = 0;
  setInterval(() => {
    frames[index].classList.remove('on');
    index = (index + 1) % frames.length;
    frames[index].classList.add('on');
  }, 1000 / Number(cell.dataset.fps));
}
</script>`;
}
