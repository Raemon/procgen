import { labyrinthCellCoordOf, labyrinthCellKey } from '@/features/asset-library/worlds/labyrinth/labyrinthLattice';
import type { LabyrinthKnobs } from '@/features/asset-library/worlds/labyrinth/labyrinthKnobs';
import type { Marker } from '@/features/asset-library/worlds/worldSampler';
import type { ReadOnlyPipelineStore } from '@/features/app-shell/runtime/readOnlyAssets';
import { fixtureLook } from './fixtures/fixtureAppearance';
import type { PuzzleFixture } from './fixtures/puzzleFixture';
import { standingFootprintOf } from './fixtures/standingFootprint';
import { fixtureAction } from './interaction/fixtureAction';
import { crateCanBePushed, pushCrate, type WalkableProbe } from './interaction/pushCrate';
import { reportDoor, useFixture, type UseOutcome } from './interaction/useFixture';
import { puzzleKnobsFromPipeline } from './puzzleKnobsFromPipeline';
import { buildPuzzleRoom } from './rooms/buildPuzzleRoom';
import { RoomCache } from './rooms/roomCache';
import {
  everyFixtureOf,
  fixtureIdIn,
  roomAcrossTheGate,
  type PuzzleRoomLayout,
} from './rooms/puzzleRoomLayout';
import { fixtureIsOn, livePosition, roomIsSolved } from './state/fixtureSignals';
import { sameKnobs } from './sameKnobs';
import { PuzzleState } from './state/puzzleState';

const ROOMS_KEPT = 512;

export class PuzzleWorld {
  private readonly rooms = new RoomCache(ROOMS_KEPT);
  private knobs: LabyrinthKnobs | null;

  constructor(
    private readonly store: ReadOnlyPipelineStore,
    private readonly tileIsWalkable: WalkableProbe,
    readonly state: PuzzleState = new PuzzleState(),
  ) {
    this.knobs = puzzleKnobsFromPipeline(store);
    store.onChange(() => this.rereadPipeline());
  }

  isActive(): boolean {
    return this.knobs !== null;
  }

  roomAt(x: number, y: number): PuzzleRoomLayout | null {
    if (!this.knobs) return null;
    const roomX = labyrinthCellCoordOf(x);
    const roomY = labyrinthCellCoordOf(y);
    return this.room(roomX, roomY);
  }

  markersIn(minX: number, minY: number, maxX: number, maxY: number): Marker[] {
    if (!this.knobs) return [];
    const markers: Marker[] = [];
    for (const layout of this.roomsOverlapping(minX, minY, maxX, maxY)) {
      this.collectMarkers(layout, minX, minY, maxX, maxY, markers);
    }
    return markers;
  }

  blocksAt(x: number, y: number): boolean {
    const layout = this.roomAt(x, y);
    return layout !== null && this.blockerAt(layout, x, y) !== null;
  }

  clearTheWay(x: number, y: number, dx: number, dy: number, mayPush = true): boolean {
    const layout = this.roomAt(x, y);
    if (!layout) return true;
    const blocker = this.blockerAt(layout, x, y);
    if (!blocker) return true;
    if (blocker.kind !== 'crate' || !mayPush) return false;
    return pushCrate(layout, this.state, blocker, dx, dy, this.tileIsWalkable);
  }

  couldPushInto(x: number, y: number, dx: number, dy: number): boolean {
    const layout = this.roomAt(x, y);
    const blocker = layout && this.blockerAt(layout, x, y);
    if (!layout || blocker?.kind !== 'crate') return false;
    return crateCanBePushed(layout, this.state, blocker, dx, dy, this.tileIsWalkable);
  }

  actionAt(x: number, y: number): string | null {
    const layout = this.roomAt(x, y);
    const fixture = layout && this.fixtureAt(layout, x, y);
    if (!layout || !fixture) return null;
    return fixtureAction(fixture.kind, this.fixtureReadsAsDone(layout, fixture));
  }

  use(x: number, y: number): UseOutcome {
    const layout = this.roomAt(x, y);
    const fixture = layout && this.fixtureAt(layout, x, y);
    if (!layout || !fixture) {
      return { ok: false, code: 'nothing_to_use', hint: `nothing to work at (${x},${y})` };
    }
    if (fixture.kind !== 'gate') return useFixture(layout, this.state, fixture);
    return reportDoor(layout, this.state, this.gateIsOpen(layout, fixture));
  }

  gateIsOpen(layout: PuzzleRoomLayout, gate: PuzzleFixture): boolean {
    if (roomIsSolved(layout, this.state)) return true;
    const across = roomAcrossTheGate(layout, gate);
    const neighbour = this.room(across.roomX, across.roomY);
    return neighbour !== null && roomIsSolved(neighbour, this.state);
  }

  takeKeysAt(x: number, y: number): string[] {
    const layout = this.roomAt(x, y);
    if (!layout) return [];
    return layout.fixtures
      .filter((candidate) => candidate.kind === 'key' && candidate.x === x && candidate.y === y)
      .filter((key) => !this.state.isOn(fixtureIdIn(layout, key.id)))
      .map((key) => {
        this.state.setOn(fixtureIdIn(layout, key.id), true);
        return key.id;
      });
  }

  resetRoomAt(x: number, y: number): PuzzleRoomLayout | null {
    const layout = this.roomAt(x, y);
    if (!layout) return null;
    this.state.forgetRoom(layout.key);
    return layout;
  }

  forgetEverySolvedRoom(): void {
    this.state.forgetAll();
  }

  private rereadPipeline(): void {
    const fresh = puzzleKnobsFromPipeline(this.store);
    if (sameKnobs(fresh, this.knobs)) return;
    this.knobs = fresh;
    this.rooms.clear();
  }

  private room(roomX: number, roomY: number): PuzzleRoomLayout | null {
    if (!this.knobs) return null;
    const key = labyrinthCellKey(roomX, roomY);
    const known = this.rooms.get(key);
    if (known) return known;
    const built = buildPuzzleRoom(this.knobs, roomX, roomY);
    this.rooms.set(key, built);
    return built;
  }

  private roomsOverlapping(
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
  ): PuzzleRoomLayout[] {
    const layouts: PuzzleRoomLayout[] = [];
    for (let roomY = labyrinthCellCoordOf(minY); roomY <= labyrinthCellCoordOf(maxY); roomY++) {
      for (let roomX = labyrinthCellCoordOf(minX); roomX <= labyrinthCellCoordOf(maxX); roomX++) {
        const layout = this.room(roomX, roomY);
        if (layout) layouts.push(layout);
      }
    }
    return layouts;
  }

  private collectMarkers(
    layout: PuzzleRoomLayout,
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
    into: Marker[],
  ): void {
    for (const fixture of everyFixtureOf(layout)) {
      const at = livePosition(layout, this.state, fixture);
      if (at.x < minX || at.x > maxX || at.y < minY || at.y > maxY) continue;
      const look = fixtureLook(fixture.kind, this.fixtureReadsAsDone(layout, fixture));
      into.push({ x: at.x, y: at.y, ...look, ...standingFootprintOf(layout, fixture, look) });
    }
  }

  private fixtureReadsAsDone(layout: PuzzleRoomLayout, fixture: PuzzleFixture): boolean {
    return fixture.kind === 'gate'
      ? this.gateIsOpen(layout, fixture)
      : fixtureIsOn(layout, this.state, fixture);
  }

  private fixturesAt(layout: PuzzleRoomLayout, x: number, y: number): PuzzleFixture[] {
    return everyFixtureOf(layout).filter((fixture) => {
      const at = livePosition(layout, this.state, fixture);
      return at.x === x && at.y === y;
    });
  }

  private fixtureAt(layout: PuzzleRoomLayout, x: number, y: number): PuzzleFixture | null {
    const here = this.fixturesAt(layout, x, y);
    return here.find((fixture) => fixture.kind !== 'plate') ?? here[0] ?? null;
  }

  private blockerAt(layout: PuzzleRoomLayout, x: number, y: number): PuzzleFixture | null {
    return this.fixturesAt(layout, x, y).find((fixture) => this.standsInTheWay(layout, fixture)) ?? null;
  }

  private standsInTheWay(layout: PuzzleRoomLayout, fixture: PuzzleFixture): boolean {
    if (fixture.kind === 'crate' || fixture.kind === 'pillar') return true;
    return fixture.kind === 'gate' && !this.gateIsOpen(layout, fixture);
  }
}
