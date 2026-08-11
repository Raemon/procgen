import type { AgentMode, AgentPose } from '../../agents/agentMode';
import { buildObservation, NO_OVERLAY, type AgentObservation } from '../../agents/observation';
import { observationLines, viewFirstLineIndex } from '../../agents/observationText';
import { PipelineEvaluator } from '@/features/asset-library/worlds/eval/evaluator';
import { PipelineStore } from '@/features/asset-library/worlds/pipeline/pipelineStore';
import { noiseTerrainState } from '@/features/asset-library/worlds/__tests__/terrainFixtureState';
import { WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import { TileAssets } from '@/features/asset-library/tiles/tileAssets';
import { hoveredTileLines } from '../hover/hoveredTileLines';
import { hoveredTileReport, type AgentEyes } from '../hover/hoveredTileReport';
import { worldCellOfObservationGridCell } from '../render/agentText/observationGridCell';
import { viewportCenteredOn } from '../render/ascii/asciiViewport';
import { DEFAULT_CHARACTER_SIGHT_RADIUS_TILES } from '../vision/characterSight';

export interface CheckReporter {
  (name: string, condition: boolean): void;
}

const POSE: AgentPose = { x: 3, y: -2, facing: 0 };
const ALWAYS_OFFERS_AN_ACTION = { markersIn: () => [], actionAt: () => 'open the oak door' };

export function checkTileHoverReadout(check: CheckReporter): void {
  checkTheHoverReadoutMatchesTheAgentGrid(check);
  checkTheTextGridMapsBackToWorldCells(check);
  checkTheReadoutTellsYouNoMoreThanTheAgentSees(check);
}

function checkTheHoverReadoutMatchesTheAgentGrid(check: CheckReporter): void {
  for (const mode of ['god', 'character'] as const) {
    const obs = observationOf(mode);
    check(
      `every tile hovered in ${mode} mode reads back the glyph that mode's agent grid drew there`,
      everyCellOfTheGrid(obs).every(
        ({ cell, column, row }) =>
          hoveredTileReport(eyesOf(mode), cell).observed.glyph === obs.view[row]![column],
      ),
    );
  }
}

function checkTheTextGridMapsBackToWorldCells(check: CheckReporter): void {
  const obs = observationOf('god');
  const center = Math.floor(obs.viewSize / 2);
  const firstGridLine = viewFirstLineIndex(obs);
  check(
    'the agent text view puts its grid where the pointer mapping counts the first grid line',
    observationLines(obs)[firstGridLine] === obs.view[0] &&
      observationLines(obs)[firstGridLine + obs.viewSize - 1] === obs.view[obs.viewSize - 1],
  );
  check(
    'hovering the middle character of the drawn grid lands on the tile the player stands on',
    sameCell(worldCellOfObservationGridCell(obs, { column: center, row: firstGridLine + center }), {
      x: POSE.x,
      y: POSE.y,
    }),
  );
  check(
    'hovering the header, the legend, or past the right edge of the grid names no tile at all',
    worldCellOfObservationGridCell(obs, { column: 0, row: firstGridLine - 1 }) === null &&
      worldCellOfObservationGridCell(obs, { column: 0, row: firstGridLine + obs.viewSize }) ===
        null &&
      worldCellOfObservationGridCell(obs, { column: obs.viewSize, row: firstGridLine }) === null,
  );
}

function checkTheReadoutTellsYouNoMoreThanTheAgentSees(check: CheckReporter): void {
  const eyes = { ...eyesOf('character'), overlay: ALWAYS_OFFERS_AN_ACTION };
  const behind = hoveredTileReport(eyes, { x: POSE.x, y: POSE.y + 1 });
  const ahead = hoveredTileReport(eyes, { x: POSE.x, y: POSE.y - 1 });
  check(
    'a tile behind the character reads as fogged and offers none of the actions waiting there',
    behind.observed.meaning.includes('unseen') && behind.action === null,
  );
  check(
    'a tile the character faces still offers the action an agent would be prompted with',
    ahead.action === 'open the oak door' &&
      hoveredTileLines(ahead).includes('press [F] to open the oak door'),
  );
  const faraway = hoveredTileReport(eyesOf('god'), { x: POSE.x + 400, y: POSE.y });
  check(
    'a tile the agent grid never reaches says so instead of reporting terrain nobody handed it',
    faraway.observed.meaning.includes('outside') && faraway.action === null,
  );
}

function everyCellOfTheGrid(
  obs: AgentObservation,
): { cell: { x: number; y: number }; column: number; row: number }[] {
  const viewport = viewportCenteredOn(obs.position.x, obs.position.y, obs.viewSize, obs.viewSize);
  const cells = [];
  for (let row = 0; row < obs.viewSize; row++) {
    for (let column = 0; column < obs.viewSize; column++) {
      cells.push({
        cell: { x: viewport.originX + column, y: viewport.originY + row },
        column,
        row,
      });
    }
  }
  return cells;
}

function sameCell(cell: { x: number; y: number } | null, expected: { x: number; y: number }) {
  return cell !== null && cell.x === expected.x && cell.y === expected.y;
}

function observationOf(mode: AgentMode): AgentObservation {
  const eyes = eyesOf(mode);
  return buildObservation(
    eyes.sampler,
    eyes.tileAssets,
    POSE,
    mode,
    DEFAULT_CHARACTER_SIGHT_RADIUS_TILES,
    NO_OVERLAY,
  );
}

const tileAssets = new TileAssets();
const sampler = samplerOfTheFirstExampleWorld();

function eyesOf(mode: AgentMode): AgentEyes {
  return {
    sampler,
    tileAssets,
    overlay: NO_OVERLAY,
    pose: POSE,
    mode,
    sightRadiusTiles: DEFAULT_CHARACTER_SIGHT_RADIUS_TILES,
  };
}

function samplerOfTheFirstExampleWorld(): WorldSampler {
  const store = new PipelineStore(noiseTerrainState());
  return new WorldSampler(store, new PipelineEvaluator(store), tileAssets);
}
