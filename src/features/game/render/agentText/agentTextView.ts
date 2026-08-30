import type { AgentMode } from '../../../agents/agentMode';
import {
  buildObservation,
  viewSizeFor,
  type AgentObservation,
  type LegendEntry,
  type ObservedOverlay,
  type ViewVision,
} from '../../../agents/observation';
import { walkabilityPhrase } from '../../../agents/observationText';
import { BLANK_GLYPH, SELF_GLYPH } from '../../../agents/observedTile';
import { measureWork } from '../../performance/workTimers';
import type { WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import type { ReadOnlyTileAssets } from '@/features/app-shell/runtime/readOnlyAssets';
import type { ReadOnlyWorld } from '@/features/app-shell/runtime/readOnlyAssets';
import type { HoveredCell, HoveredTile } from '../../hover/hoveredTile';
import { listenForTileHover } from '../../hover/listenForTileHover';
import { clampGodViewSizeTiles } from '../../vision/godViewSize';
import { pointOverlayLookup } from '../ascii/asciiCells';
import { viewportCenteredOn } from '../ascii/asciiViewport';
import type { CameraFocus } from '../camera/cameraFocus';
import { WheelTileZoom } from '../camera/wheelTileZoom';
import { listenForWheelZoom } from '../camera/wheelZoomListener';
import {
  charactersInPlay,
  characterWithId,
  type CharacterListing,
} from '../../multiplayer/client/charactersInPlay';
import type { RemotePlayers } from '../../multiplayer/client/remotePlayers';
import { SELF_INK, characterInkLookup, withCharactersPainted } from './characterGlyphs';
import { asciiColorOn, onAsciiColorChange } from './asciiColorPreference';
import {
  ASCII_GLYPH_GRID_CLASSES,
  asciiGlyphPaint,
  type AsciiGlyphPaint,
} from './asciiGlyphPaint';
import { elevationGlyphPaint } from './elevationGlyphPaint';
import { sizeSquareGlyphGrid, squareGlyphGrid } from './squareGlyphGrid';
import { monospaceCellSize, type MonospaceCellSize } from './monospaceCellSize';
import { worldCellOfObservationGridCell } from './observationGridCell';
import { textGridCellUnderPointer } from './textGridCellUnderPointer';

const ROOT_CLASSES =
  'absolute inset-0 flex flex-col gap-3 overflow-auto p-4 font-mono text-[13px] leading-[1.15] text-emerald-100/90';
const FITTED_ROOT_CLASSES =
  'absolute inset-0 flex flex-col gap-2 overflow-hidden p-3 font-mono text-[13px] leading-[1.15] text-emerald-100/90';
const HEADER_CLASSES = 'whitespace-pre-wrap text-emerald-200/70';
const COLUMNS_CLASSES = 'flex flex-wrap items-start gap-x-8 gap-y-3';
const SIDEBAR_COLUMNS_CLASSES = 'flex flex-col gap-3 font-mono text-[11px] leading-[1.15] text-emerald-100/90';
const GRID_BOX_CLASSES = 'flex min-h-0 flex-1 items-start justify-center overflow-hidden';
const COLUMN_TITLE_CLASSES = 'mb-1 text-[11px] uppercase tracking-wider text-emerald-200/50';
const ELEVATION_CLASSES = `${ASCII_GLYPH_GRID_CLASSES} text-emerald-100/60`;
const LEGEND_CLASSES = 'space-y-0.5';
const LEGEND_LINE_CLASSES = 'whitespace-pre-wrap';
const INTERACTION_CLASSES = 'mt-2 whitespace-pre-wrap text-amber-200/90';
const CHARACTER_POLL_MS = 250;
const SMALLEST_GLYPH_PIXELS = 4;
const LARGEST_GLYPH_PIXELS = 40;
const SMALLEST_ELEVATION_GLYPH_PIXELS = 3;
const LARGEST_ELEVATION_GLYPH_PIXELS = 11;

type CellInk = (glyph: string, row: number, column: number) => AsciiGlyphPaint | null;

export interface AgentTextViewOptions {
  container: HTMLElement;
  sidebar?: HTMLElement;
  world: ReadOnlyWorld;
  sampler: WorldSampler;
  tileAssets: ReadOnlyTileAssets;
  mode: AgentMode;
  overlay: ObservedOverlay;
  hoveredTile: HoveredTile;
  remotePlayers: RemotePlayers;
  cameraFocus: CameraFocus;
  setViewSizeTiles?: (sizeTiles: number) => void;
}

export class AgentTextView {
  private readonly root = document.createElement('div');
  private readonly header = document.createElement('div');
  private readonly gridBox = document.createElement('div');
  private readonly gridPre = document.createElement('pre');
  private readonly elevationColumn = document.createElement('div');
  private readonly elevationPre = document.createElement('pre');
  private readonly legendList = document.createElement('div');
  private readonly interaction = document.createElement('div');
  private readonly world: ReadOnlyWorld;
  private readonly sampler: WorldSampler;
  private readonly tileAssets: ReadOnlyTileAssets;
  private readonly mode: AgentMode;
  private readonly overlay: ObservedOverlay;
  private readonly remotePlayers: RemotePlayers;
  private readonly cameraFocus: CameraFocus;
  private readonly sidebar: HTMLElement | null;
  private readonly setViewSizeTiles: ((sizeTiles: number) => void) | null;
  private readonly zoom = new WheelTileZoom(clampGodViewSizeTiles);
  private readonly stopWatchingColor: () => void;
  private readonly stopWatchingFocus: () => void;
  private readonly characterPoll: ReturnType<typeof setInterval>;
  private readonly resize: ResizeObserver | null;
  private readonly sidebarColumns: HTMLElement | null;
  private drawnObservation: AgentObservation | null = null;
  private cellSize: MonospaceCellSize | null = null;
  private drawnScene = '';

  constructor(options: AgentTextViewOptions) {
    this.world = options.world;
    this.sampler = options.sampler;
    this.tileAssets = options.tileAssets;
    this.mode = options.mode;
    this.overlay = options.overlay;
    this.remotePlayers = options.remotePlayers;
    this.cameraFocus = options.cameraFocus;
    this.sidebar = options.sidebar ?? null;
    this.setViewSizeTiles = options.setViewSizeTiles ?? null;
    this.root.className = this.sidebar ? FITTED_ROOT_CLASSES : ROOT_CLASSES;
    this.header.className = HEADER_CLASSES;
    this.gridBox.className = GRID_BOX_CLASSES;
    this.gridPre.className = ASCII_GLYPH_GRID_CLASSES;
    this.elevationPre.className = ELEVATION_CLASSES;
    this.legendList.className = LEGEND_CLASSES;
    this.interaction.className = INTERACTION_CLASSES;
    this.gridBox.append(this.gridPre);
    const legend = assembleColumn(
      document.createElement('div'),
      'legend',
      this.legendList,
      this.interaction,
    );
    const elevation = assembleColumn(this.elevationColumn, 'elevation (0-9, a-z)', this.elevationPre);
    this.sidebarColumns = this.sidebar ? readoutColumns(SIDEBAR_COLUMNS_CLASSES, legend, elevation) : null;
    if (this.sidebar && this.sidebarColumns) this.sidebar.append(this.sidebarColumns);
    else this.legendList.classList.add('max-w-[30rem]');
    this.root.append(
      this.header,
      this.gridBox,
      ...(this.sidebarColumns ? [] : [readoutColumns(COLUMNS_CLASSES, elevation, legend)]),
    );
    options.container.appendChild(this.root);
    listenForTileHover(this.gridPre, options.hoveredTile, (x, y) => this.cellAtPixel(x, y));
    if (this.setViewSizeTiles) {
      listenForWheelZoom(this.root, (wheelPixelsY) => this.zoomByWheelPixels(wheelPixelsY));
    }
    this.resize = this.watchForResize();
    this.stopWatchingColor = onAsciiColorChange(() => this.draw());
    this.stopWatchingFocus = this.cameraFocus.subscribe(() => this.draw());
    this.characterPoll = setInterval(() => this.drawIfCharactersMoved(), CHARACTER_POLL_MS);
  }

  dispose(): void {
    clearInterval(this.characterPoll);
    this.resize?.disconnect();
    this.stopWatchingFocus();
    this.stopWatchingColor();
    this.sidebarColumns?.remove();
    this.root.remove();
  }

  draw(): void {
    measureWork('ascii view', () => this.render());
  }

  private watchForResize(): ResizeObserver | null {
    if (typeof ResizeObserver !== 'function') return null;
    const resize = new ResizeObserver(() => this.draw());
    resize.observe(this.gridBox);
    return resize;
  }

  private zoomByWheelPixels(wheelPixelsY: number): void {
    const next = this.zoom.sizeAfterWheelPixels(this.viewSize(), wheelPixelsY);
    if (next !== null) this.setViewSizeTiles?.(next);
  }

  private drawIfCharactersMoved(): void {
    const characters = this.characters();
    if (this.sceneSignature(characters) === this.drawnScene) return;
    this.draw();
  }

  private characters(): CharacterListing[] {
    return charactersInPlay(this.world, this.remotePlayers);
  }

  private sceneSignature(characters: CharacterListing[]): string {
    return `${charactersSignature(characters)}#${this.markersSignature()}`;
  }

  private markersSignature(): string {
    const center = this.viewCenter();
    const size = this.viewSize();
    const viewport = viewportCenteredOn(center.x, center.y, size, size);
    return this.overlay
      .markersIn(
        viewport.originX,
        viewport.originY,
        viewport.originX + size - 1,
        viewport.originY + size - 1,
      )
      .map((marker) => `${marker.glyph}${marker.color}${marker.x},${marker.y}`)
      .join('|');
  }

  private render(): void {
    const characters = this.characters();
    this.drawnScene = this.sceneSignature(characters);
    const obs = (this.drawnObservation = withCharactersPainted(
      this.currentObservation(),
      characters,
    ));
    const ink = asciiColorOn() ? this.cellInk(obs, characters) : null;
    const glyphPaints = new Map<string, AsciiGlyphPaint>();
    this.header.textContent = headerText(obs, this.followedName(characters));
    this.fitGlyphsToTheirBox(obs.viewSize);
    sizeSquareGlyphGrid(this.gridPre, obs.viewSize);
    this.gridPre.replaceChildren(...squareGlyphGrid(obs.view, ink, glyphPaints));
    this.elevationColumn.classList.toggle('hidden', obs.elevation === null);
    if (obs.elevation) {
      sizeSquareGlyphGrid(this.elevationPre, obs.viewSize);
      const elevationInk = ink === null ? null : elevationGlyphPaint(obs.elevation);
      this.elevationPre.replaceChildren(...squareGlyphGrid(obs.elevation, elevationInk));
    } else {
      this.elevationPre.replaceChildren();
    }
    this.legendList.replaceChildren(...obs.legend.map((entry) => legendLine(entry, glyphPaints)));
    this.interaction.classList.toggle('hidden', obs.interaction === null);
    this.interaction.textContent = obs.interaction ?? '';
  }

  private fitGlyphsToTheirBox(viewSize: number): void {
    if (!this.sidebar) return;
    const box = this.gridBox.getBoundingClientRect();
    this.gridPre.style.fontSize = `${glyphPixelsWithin(
      Math.min(box.width, box.height),
      viewSize,
      SMALLEST_GLYPH_PIXELS,
      LARGEST_GLYPH_PIXELS,
    )}px`;
    this.elevationPre.style.fontSize = `${glyphPixelsWithin(
      this.sidebar.getBoundingClientRect().width,
      viewSize,
      SMALLEST_ELEVATION_GLYPH_PIXELS,
      LARGEST_ELEVATION_GLYPH_PIXELS,
    )}px`;
    this.cellSize = null;
  }

  private cellInk(obs: AgentObservation, characters: CharacterListing[]): CellInk {
    const viewport = viewportCenteredOn(obs.position.x, obs.position.y, obs.viewSize, obs.viewSize);
    const markers = pointOverlayLookup(this.sampler, viewport, this.overlay);
    const characterInks = characterInkLookup(characters);
    return (glyph, row, column) => {
      if (glyph === BLANK_GLYPH) return null;
      const x = viewport.originX + column;
      const y = viewport.originY + row;
      const characterInk = characterInks.get(`${x},${y}`);
      if (characterInk) return asciiGlyphPaint(characterInk, null);
      if (glyph === SELF_GLYPH) return asciiGlyphPaint(SELF_INK, null);
      const markerColor = markers.get(`${x},${y}`)?.color;
      if (markerColor) return asciiGlyphPaint(markerColor, null);
      const tile = this.tileAssets.byId(this.sampler.tileAt(x, y));
      if (!tile?.color) return null;
      return asciiGlyphPaint(tile.color, tile.walkable);
    };
  }

  private cellAtPixel(offsetX: number, offsetY: number): HoveredCell | null {
    const observation = this.drawnObservation;
    const cellSize = this.measuredCellSize();
    if (!observation || !cellSize) return null;
    return worldCellOfObservationGridCell(
      observation,
      textGridCellUnderPointer(this.gridPre, cellSize, offsetX, offsetY),
    );
  }

  private measuredCellSize(): MonospaceCellSize | null {
    this.cellSize ??= monospaceCellSize(this.gridPre);
    return this.cellSize;
  }

  private vision(): ViewVision {
    return {
      sightRadiusTiles: this.world.sightRadiusTiles,
      godViewSizeTiles: this.world.godViewSizeTiles,
    };
  }

  private viewSize(): number {
    return viewSizeFor(this.mode, this.vision());
  }

  private currentObservation(): AgentObservation {
    const pose = { ...this.viewCenter(), facing: this.world.facing };
    return buildObservation(
      this.sampler,
      this.tileAssets,
      pose,
      this.mode,
      this.vision(),
      this.overlay,
    );
  }

  private followedName(characters: CharacterListing[]): string | null {
    if (this.mode !== 'god') return null;
    const followed = characters.find((character) => character.id === this.cameraFocus.followedId());
    return followed && !followed.isSelf ? followed.name : null;
  }

  private viewCenter(): { x: number; y: number } {
    const followedId = this.cameraFocus.followedId();
    const followed =
      followedId === null || this.mode !== 'god'
        ? null
        : characterWithId(this.world, this.remotePlayers, followedId);
    if (!followed) return { x: this.world.playerX, y: this.world.playerY };
    return { x: followed.x, y: followed.y };
  }
}

function glyphPixelsWithin(
  boxPixels: number,
  viewSize: number,
  smallest: number,
  largest: number,
): number {
  if (boxPixels <= 0) return smallest;
  return Math.max(smallest, Math.min(largest, Math.floor(boxPixels / viewSize)));
}

function readoutColumns(className: string, ...columns: HTMLElement[]): HTMLElement {
  const row = document.createElement('div');
  row.className = className;
  row.append(...columns);
  return row;
}

function charactersSignature(characters: CharacterListing[]): string {
  return characters.map((character) => `${character.id}:${character.x},${character.y}`).join('|');
}

function assembleColumn(column: HTMLElement, title: string, ...content: HTMLElement[]): HTMLElement {
  const heading = document.createElement('div');
  heading.className = COLUMN_TITLE_CLASSES;
  heading.textContent = title;
  column.replaceChildren(heading, ...content);
  return column;
}

function headerText(obs: AgentObservation, followedName: string | null): string {
  const half = Math.floor(obs.viewSize / 2);
  const originX = obs.position.x - half;
  const originY = obs.position.y - half;
  const pose = [
    `${obs.mode} view`,
    followedName === null
      ? `@ (${obs.position.x},${obs.position.y})`
      : `centered on ${followedName} (${obs.position.x},${obs.position.y})`,
    obs.facing ? `facing ${obs.facing}` : null,
    obs.sightRadiusTiles !== null ? `sight ${obs.sightRadiusTiles}t` : null,
    obs.godViewSizeTiles !== null ? `${obs.godViewSizeTiles}x${obs.godViewSizeTiles} tiles` : null,
  ]
    .filter((part) => part !== null)
    .join(' · ');
  return `${pose}\norigin (${originX},${originY}) top-left · north is up, y grows south`;
}

function legendLine(entry: LegendEntry, glyphPaints: Map<string, AsciiGlyphPaint>): HTMLElement {
  const line = document.createElement('div');
  line.className = LEGEND_LINE_CLASSES;
  const glyph = document.createElement('span');
  glyph.textContent = `'${entry.glyph}'`;
  const paint = glyphPaints.get(entry.glyph);
  if (paint) {
    glyph.style.color = paint.color;
    if (paint.opacity !== 1) glyph.style.opacity = String(paint.opacity);
  }
  const phrase = walkabilityPhrase(entry.walkable);
  const suffix = phrase === null ? '' : ` (${phrase})`;
  line.append(glyph, document.createTextNode(` ${entry.meaning}${suffix}`));
  return line;
}
