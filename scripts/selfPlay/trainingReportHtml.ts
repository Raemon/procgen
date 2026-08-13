import type { GenerationRecord } from '@/features/asset-library/worlds/selfPlay/trainingLoop';

export interface ReportElite {
  rank: number;
  fun: number;
  paletteName: string;
  cell: string;
  nodeSummary: string;
  readings: { name: string; value: number; score: number }[];
  thumbnail: string;
  genomeFileName: string;
}

export interface ReportPage {
  headline: string;
  trajectory: readonly GenerationRecord[];
  elites: readonly ReportElite[];
  stillRunning: boolean;
}

const CURVE_WIDTH = 720;
const CURVE_HEIGHT = 180;

export function trainingReportHtml(page: ReportPage): string {
  return [
    '<!doctype html><html><head><meta charset="utf-8"><title>Walking-sim self play</title>',
    page.stillRunning ? '<meta http-equiv="refresh" content="20">' : '',
    `<style>${pageCss()}</style></head><body>`,
    `<h1>Self play against the walking-simulator benchmark</h1><p class="sub">${page.headline}</p>`,
    curveHtml(page.trajectory),
    trajectoryTableHtml(page.trajectory),
    '<h2>Archive elites</h2>',
    page.elites.map(eliteCardHtml).join('\n'),
    '</body></html>',
  ].join('\n');
}

function curveHtml(trajectory: readonly GenerationRecord[]): string {
  if (trajectory.length === 0) return '<p class="sub">no generations yet</p>';
  return [
    `<svg class="curve" viewBox="0 0 ${CURVE_WIDTH} ${CURVE_HEIGHT}">`,
    polylineHtml(trajectory.map((each) => each.archiveBestFun), '#ffd86a'),
    polylineHtml(trajectory.map((each) => each.batch.meanFun), '#4d7ec2'),
    polylineHtml(trajectory.map((each) => each.batch.diversity), '#5fbf8f'),
    polylineHtml(trajectory.map((each) => each.coverage), '#c26fd2'),
    '</svg>',
    '<p class="legend"><span style="color:#ffd86a">best fun</span> · <span style="color:#4d7ec2">batch mean fun</span> · <span style="color:#5fbf8f">batch diversity</span> · <span style="color:#c26fd2">archive coverage</span></p>',
  ].join('\n');
}

function polylineHtml(values: readonly number[], ink: string): string {
  const points = values
    .map((value, at) => `${pointAcross(at, values.length)},${pointDown(value)}`)
    .join(' ');
  return `<polyline fill="none" stroke="${ink}" stroke-width="2" points="${points}" />`;
}

function pointAcross(at: number, count: number): number {
  return count < 2 ? 0 : (at / (count - 1)) * CURVE_WIDTH;
}

function pointDown(value: number): number {
  return CURVE_HEIGHT - Math.max(0, Math.min(1, value)) * CURVE_HEIGHT;
}

function trajectoryTableHtml(trajectory: readonly GenerationRecord[]): string {
  const rows = trajectory.slice(-12).map(trajectoryRowHtml).join('');
  return [
    '<table class="runs"><thead><tr><th>gen</th><th>best fun</th><th>batch fun</th>',
    '<th>diversity</th><th>dupes</th><th>coverage</th><th>admitted</th><th>no spawn</th></tr></thead>',
    `<tbody>${rows}</tbody></table>`,
  ].join('');
}

function trajectoryRowHtml(record: GenerationRecord): string {
  const cells = [
    record.generation,
    record.archiveBestFun.toFixed(3),
    record.batch.meanFun.toFixed(3),
    record.batch.diversity.toFixed(3),
    record.batch.nearDuplicatePairs,
    record.coverage.toFixed(2),
    record.admissions,
    record.worldsWithNowhereToWalk,
  ];
  return `<tr>${cells.map((cell) => `<td>${cell}</td>`).join('')}</tr>`;
}

function eliteCardHtml(elite: ReportElite): string {
  return [
    `<section class="card"><header><span class="rank">#${elite.rank}</span>`,
    `<span class="score">${elite.fun.toFixed(3)}</span>`,
    `<span class="title">${elite.paletteName}</span>`,
    `<span class="meta">cell ${elite.cell} · ${elite.nodeSummary}</span></header>`,
    `<div class="body"><pre class="thumb">${elite.thumbnail}</pre>`,
    `<div class="side">${readingsTableHtml(elite)}<p class="meta">play it: <code>${elite.genomeFileName}</code></p></div></div></section>`,
  ].join('');
}

function readingsTableHtml(elite: ReportElite): string {
  const rows = elite.readings.map(readingRowHtml).join('');
  return `<table><tbody>${rows}</tbody></table>`;
}

function readingRowHtml(reading: { name: string; value: number; score: number }): string {
  return [
    `<tr><td>${reading.name}</td><td class="num">${reading.value.toFixed(2)}</td>`,
    `<td class="bar"><div style="width:${Math.round(reading.score * 100)}%"></div></td></tr>`,
  ].join('');
}

function pageCss(): string {
  return `
  body { background: #14161a; color: #d8dbe0; font: 14px/1.5 system-ui, sans-serif; margin: 2rem; }
  h1 { font-size: 1.3rem; } h2 { font-size: 1.1rem; margin-top: 1.6rem; } .sub, .legend { color: #8a8f98; }
  .curve { width: 100%; max-width: 760px; background: #0b0d10; border-radius: 6px; }
  table.runs { border-collapse: collapse; margin: 0.6rem 0; }
  table.runs th, table.runs td { padding: 2px 10px; text-align: right; color: #9fb6d0; }
  .card { border: 1px solid #2a2e35; border-radius: 8px; margin: 1rem 0; padding: 0.8rem 1rem; }
  .card header { display: flex; gap: 0.8rem; align-items: baseline; flex-wrap: wrap; }
  .rank { font-weight: 700; } .score { color: #ffd86a; font-weight: 700; }
  .title { font-weight: 600; } .meta { color: #8a8f98; font-size: 0.85rem; }
  .body { display: flex; gap: 1.2rem; align-items: flex-start; flex-wrap: wrap; margin-top: 0.6rem; }
  .thumb { background: #0b0d10; padding: 8px; border-radius: 6px; font: 9px/1 monospace; letter-spacing: 1px; overflow: auto; max-width: 100%; }
  .side { min-width: 300px; flex: 1; }
  table { border-collapse: collapse; width: 100%; }
  td { padding: 2px 6px; } td.num { text-align: right; color: #9fb6d0; }
  td.bar { width: 40%; } td.bar div { background: #4d7ec2; height: 8px; border-radius: 4px; }
  code { color: #ffd86a; }
  `;
}
