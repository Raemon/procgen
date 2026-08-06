import type { AgentObservation, LegendEntry } from './observation';

export function observationText(obs: AgentObservation): string {
  return [...headerLines(obs), '', ...obs.view, '', 'legend:', ...legendLines(obs.legend)].join(
    '\n',
  );
}

function headerLines(obs: AgentObservation): string[] {
  const half = Math.floor(obs.viewSize / 2);
  const originX = obs.position.x - half;
  const originY = obs.position.y - half;
  const lines = [
    `mode=${obs.mode} position=(${obs.position.x},${obs.position.y})` +
      (obs.facing ? ` facing=${obs.facing}` : ''),
    `origin (top-left of grid) = (${originX},${originY}); y increases south (down); north is up.`,
    `grid: row r, col c = world tile (${originX}+c, ${originY}+r). you are '@' at the center.`,
  ];
  if (obs.mode === 'character') {
    lines.push(
      'you only see what is in front of you; the blank side of the grid is behind you, and it tells you which way you face.',
    );
  }
  return lines;
}

function legendLines(legend: readonly LegendEntry[]): string[] {
  return legend.map(
    (entry) => `'${entry.glyph}' = ${entry.meaning}${walkabilitySuffix(entry.walkable)}`,
  );
}

function walkabilitySuffix(walkable: boolean | null): string {
  if (walkable === null) return '';
  return walkable ? ' (you can walk here)' : ' (blocks you)';
}
