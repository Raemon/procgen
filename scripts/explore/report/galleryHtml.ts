import type { WorldMeasurements, WorldScore } from '../metrics/worldScore';

export interface GalleryWorld {
  rank: number;
  title: string;
  seed: number;
  nodeSummary: string;
  steps: number;
  exhaustedRegion: boolean;
  score: WorldScore;
  measurements: WorldMeasurements;
  thumbnail: string;
  pipelineFileName: string;
  pipelineJson: string;
}

export function galleryPageHtml(worlds: GalleryWorld[], generatedLabel: string): string {
  return [
    '<!doctype html><html><head><meta charset="utf-8"><title>World gallery</title>',
    `<style>${pageCss()}</style></head><body>`,
    `<h1>Rolled worlds, ranked by explorer score</h1><p class="sub">${generatedLabel}</p>`,
    worlds.map(cardHtml).join('\n'),
    '</body></html>',
  ].join('\n');
}

function cardHtml(world: GalleryWorld): string {
  return [
    `<section class="card"><header><span class="rank">#${world.rank}</span>`,
    `<span class="score">${world.score.overall.toFixed(3)}</span>`,
    `<span class="title">${world.title}</span>`,
    `<span class="meta">seed ${world.seed} · ${world.nodeSummary} · ${coverageLabel(world)}</span></header>`,
    `<div class="body"><pre class="thumb">${world.thumbnail}</pre>`,
    `<div class="side">${metricsTableHtml(world.score)}${loadHintHtml(world)}</div></div></section>`,
  ].join('');
}

function coverageLabel(world: GalleryWorld): string {
  const region = world.exhaustedRegion ? 'region fully explored' : 'budget exhausted';
  return `${world.steps} steps · ${world.measurements.uniqueCells} cells · ${region}`;
}

function metricsTableHtml(score: WorldScore): string {
  const rows = score.readings.map(metricRowHtml).join('');
  return `<table><tbody>${rows}</tbody></table>`;
}

function metricRowHtml(reading: { name: string; value: number; score: number }): string {
  const width = Math.round(reading.score * 100);
  return [
    `<tr><td>${reading.name}</td><td class="num">${reading.value.toFixed(2)}</td>`,
    `<td class="bar"><div style="width:${width}%"></div></td></tr>`,
  ].join('');
}

function loadHintHtml(world: GalleryWorld): string {
  return [
    `<details><summary>pipeline json (${world.pipelineFileName})</summary>`,
    `<p>To play this world: paste this pipeline into the world editor.</p>`,
    `<pre class="json">${world.pipelineJson.replace(/</g, '&lt;')}</pre></details>`,
  ].join('');
}

function pageCss(): string {
  return `
  body { background: #14161a; color: #d8dbe0; font: 14px/1.5 system-ui, sans-serif; margin: 2rem; }
  h1 { font-size: 1.3rem; } .sub { color: #8a8f98; }
  .card { border: 1px solid #2a2e35; border-radius: 8px; margin: 1.2rem 0; padding: 0.8rem 1rem; }
  .card header { display: flex; gap: 0.8rem; align-items: baseline; flex-wrap: wrap; }
  .rank { font-weight: 700; } .score { color: #ffd86a; font-weight: 700; }
  .title { font-weight: 600; } .meta { color: #8a8f98; font-size: 0.85rem; }
  .body { display: flex; gap: 1.2rem; align-items: flex-start; flex-wrap: wrap; margin-top: 0.6rem; }
  .thumb { background: #0b0d10; padding: 8px; border-radius: 6px; font: 9px/1 monospace; letter-spacing: 1px; overflow: auto; max-width: 100%; }
  .side { min-width: 300px; flex: 1; }
  table { border-collapse: collapse; width: 100%; }
  td { padding: 2px 6px; } td.num { text-align: right; color: #9fb6d0; }
  td.bar { width: 40%; } td.bar div { background: #4d7ec2; height: 8px; border-radius: 4px; }
  details { margin-top: 0.8rem; } summary { cursor: pointer; color: #9fb6d0; }
  .json { background: #0b0d10; padding: 8px; border-radius: 6px; font: 11px/1.4 monospace; overflow: auto; max-height: 300px; }
  code { color: #ffd86a; }
  `;
}
