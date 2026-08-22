import {
  DEFAULT_CHARACTER_SIGHT_RADIUS_TILES,
  MAX_CHARACTER_SIGHT_RADIUS_TILES,
  MIN_CHARACTER_SIGHT_RADIUS_TILES,
} from '@/features/game/vision/characterSight';
import type { AgentObservation, LegendEntry } from './observation';

export function observationText(obs: AgentObservation): string {
  return observationLines(obs).join('\n');
}

export function observationLines(obs: AgentObservation): string[] {
  return [
    ...headerLines(obs),
    '',
    ...obs.view,
    ...elevationLines(obs),
    '',
    'legend:',
    ...legendLines(obs.legend),
    ...interactionLines(obs),
  ];
}

function elevationLines(obs: AgentObservation): string[] {
  if (obs.elevation === null) return [];
  return [
    '',
    'elevation (climb level per tile, 0-9 then a-z; you can step up at most 1 level, down any; blank = unseen):',
    ...obs.elevation,
  ];
}

function interactionLines(obs: AgentObservation): string[] {
  if (obs.interaction === null) return [];
  return ['', `${obs.interaction} (the '${USE_ACTION[obs.mode]}' action)`];
}

const USE_ACTION: Record<AgentObservation['mode'], string> = {
  god: 'use_fixture',
  character: 'use',
};

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
      `your sight fades into fog at ${obs.sightRadiusTiles} tiles, so the corners of the grid are blank too: what you see is the half-disc in front of you, exactly the ground the first-person 2.5D character view renders before its fog closes in.`,
      sightRadiusLine(obs.sightRadiusTiles ?? DEFAULT_CHARACTER_SIGHT_RADIUS_TILES),
    );
  }
  return lines;
}

function sightRadiusLine(radius: number): string {
  const range = `${MIN_CHARACTER_SIGHT_RADIUS_TILES}-${MAX_CHARACTER_SIGHT_RADIUS_TILES}`;
  const at =
    radius === DEFAULT_CHARACTER_SIGHT_RADIUS_TILES
      ? `the default ${radius}`
      : `${radius}, widened from the default ${DEFAULT_CHARACTER_SIGHT_RADIUS_TILES}`;
  return (
    `that radius is yours to set: 'set_sight_radius' takes any radius in ${range} tiles (currently ${at}). ` +
    'seeing farther costs you — the grid grows with the square of the radius, and so does the world the view has to draw — ' +
    'so widen it to plan, then narrow it again to travel cheaply.'
  );
}

function legendLines(legend: readonly LegendEntry[]): string[] {
  return legend.map(
    (entry) => `'${entry.glyph}' = ${entry.meaning}${walkabilitySuffix(entry.walkable)}`,
  );
}

export function walkabilityPhrase(walkable: boolean | null): string | null {
  if (walkable === null) return null;
  return walkable ? 'you can walk here' : 'blocks you';
}

function walkabilitySuffix(walkable: boolean | null): string {
  const phrase = walkabilityPhrase(walkable);
  return phrase === null ? '' : ` (${phrase})`;
}
