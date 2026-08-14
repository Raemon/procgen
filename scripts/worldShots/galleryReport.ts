import type { ImageInterest } from './imageInterest';

export interface WorldShotRecord {
  slug: string;
  name: string;
  fun: number;
  verdict: ImageInterest['verdict'];
  interest: ImageInterest;
  elevationGateShare: number;
  vistaMomentsPer100Steps: number;
  decisionPointsPer100Steps: number;
  encountersPer100Steps: number;
  shots: string[];
}

export function galleryHtml(records: readonly WorldShotRecord[], headline: string): string {
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>World Shots</title>
<style>
body { font-family: system-ui, sans-serif; background: #14181a; color: #e8ece9; margin: 2rem; }
h1 { font-size: 1.4rem; } .headline { color: #9aa8a0; margin-bottom: 2rem; }
.world { margin-bottom: 3rem; }
.world h2 { font-size: 1.1rem; margin: 0 0 0.2rem; }
.stats { color: #9aa8a0; font-size: 0.85rem; margin-bottom: 0.6rem; font-family: ui-monospace, monospace; }
.verdict-interesting { color: #7fd4a8; } .verdict-dull, .verdict-monotonous, .verdict-noisy { color: #e08a6a; }
.shots { display: flex; gap: 12px; flex-wrap: wrap; }
.shots figure { margin: 0; }
.shots img { max-width: 420px; border-radius: 4px; display: block; }
.shots figcaption { color: #9aa8a0; font-size: 0.75rem; margin-top: 0.2rem; }
</style></head><body>
<h1>Generated worlds</h1>
<div class="headline">${escapeHtml(headline)}</div>
${records.map(worldCard).join('\n')}
</body></html>
`;
}

function worldCard(record: WorldShotRecord): string {
  return `<div class="world">
<h2>${escapeHtml(record.name)} <span class="verdict-${record.verdict}">[${record.verdict}]</span></h2>
<div class="stats">fun ${record.fun.toFixed(3)} · gates ${record.elevationGateShare.toFixed(2)} · vistas/100 ${record.vistaMomentsPer100Steps.toFixed(1)} · decisions/100 ${record.decisionPointsPer100Steps.toFixed(1)} · encounters/100 ${record.encountersPer100Steps.toFixed(1)} · color bits ${record.interest.colorEntropyBits.toFixed(1)} · edges ${(record.interest.edgeShare * 100).toFixed(0)}%</div>
<div class="shots">${record.shots.map((shot) => shotFigure(record.slug, shot)).join('')}</div>
</div>`;
}

function shotFigure(slug: string, shot: string): string {
  return `<figure><img src="${slug}/${shot}" alt="${shot}"><figcaption>${shot.replace('.png', '')}</figcaption></figure>`;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
