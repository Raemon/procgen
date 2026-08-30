import { labyrinthCellCoordOf, labyrinthCellKey } from '@/features/asset-library/worlds/labyrinth/labyrinthLattice';
import type { LabyrinthKnobs } from '@/features/asset-library/worlds/labyrinth/labyrinthKnobs';
import { NO_ITEMS, type ItemSource } from '@/features/asset-library/items/itemAssets';
import { KEY_ITEM_ID } from '@/features/asset-library/items/defaultItems';
import type { DoorwaySide } from '@/features/asset-library/worlds/labyrinth/roomLayout';
import type { ItemSpawn, Marker } from '@/features/asset-library/worlds/worldSampler';
import type { ReadOnlyPipelineStore } from '@/features/app-shell/runtime/readOnlyAssets';
import { fixtureLook, gateLook } from './fixtures/fixtureAppearance';
import type { PuzzleFixture } from './fixtures/puzzleFixture';
import { fixtureAction } from './interaction/fixtureAction';
import { crateCanBePushed, pushCrate, type WalkableProbe } from './interaction/pushCrate';
import { NO_KEYS, type KeyPurse } from './interaction/keyPurse';
import { reportDoor, useFixture, type UseOutcome } from './interaction/useFixture';
import { puzzleKnobsFromPipeline } from './puzzleKnobsFromPipeline';
import { buildPuzzleRoom } from './rooms/buildPuzzleRoom';
import { RoomCache } from './rooms/roomCache';
import {
  everyFixtureOf,
  oppositeSide,
  roomAcrossTheGate,
  sideOfGate,
  type PuzzleRoomLayout,
} from './rooms/puzzleRoomLayout';
import type { RoomItem } from './rooms/roomItem';
import { fixtureIsOn, livePosition, roomIsSolved } from './state/fixtureSignals';
import { keyItemId, unlockedSideId } from './state/roomKeys';
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
    private readonly items: ItemSource = NO_ITEMS,
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

  itemSpawnsIn(minX: number, minY: number, maxX: number, maxY: number): ItemSpawn[] {
    if (!this.knobs) return [];
    const key = this.items.byId(KEY_ITEM_ID);
    if (!key) return [];
    const spawns: ItemSpawn[] = [];
    for (const layout of this.roomsOverlapping(minX, minY, maxX, maxY)) {
      for (const item of this.untakenItemsOf(layout)) {
        if (item.x < minX || item.x > maxX || item.y < minY || item.y > maxY) continue;
        spawns.push({
          x: item.x,
          y: item.y,
          itemId: key.id,
          name: key.name,
          glyph: key.symbol,
          color: key.color,
          tag: 'key',
        });
      }
    }
    return spawns;
  }

  takeSpawn(spawn: ItemSpawn): boolean {
    if (spawn.itemId !== KEY_ITEM_ID) return false;
    const layout = this.roomAt(spawn.x, spawn.y);
    if (!layout) return false;
    const item = this.untakenItemsOf(layout).find(
      (candidate) => candidate.x === spawn.x && candidate.y === spawn.y,
    );
    if (!item) return false;
    this.state.setOn(keyItemId(layout, item.id), true);
    return true;
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
    if (fixture.kind === 'gate' && !this.gateIsOpen(layout, fixture)) {
      return layout.unlock === 'key' ? 'unlock the door with a key' : 'try the barred door';
    }
    return fixtureAction(fixture.kind, this.fixtureReadsAsDone(layout, fixture));
  }

  use(x: number, y: number, purse: KeyPurse = NO_KEYS): UseOutcome {
    const layout = this.roomAt(x, y);
    const fixture = layout && this.fixtureAt(layout, x, y);
    if (!layout || !fixture) {
      return { ok: false, code: 'nothing_to_use', hint: `nothing to work at (${x},${y})` };
    }
    if (fixture.kind !== 'gate') return useFixture(layout, this.state, fixture);
    if (this.gateIsOpen(layout, fixture)) return reportDoor(layout, this.state, true);
    if (layout.unlock !== 'key') return reportDoor(layout, this.state, false);
    return this.unlockWithKey(layout, fixture, purse);
  }

  gateIsOpen(layout: PuzzleRoomLayout, gate: PuzzleFixture): boolean {
    const side = sideOfGate(layout, gate);
    if (this.roomOpensGate(layout, side)) return true;
    const across = roomAcrossTheGate(layout, gate);
    const neighbour = this.room(across.roomX, across.roomY);
    return neighbour !== null && this.roomOpensGate(neighbour, oppositeSide(side));
  }

  takeKeysAt(x: number, y: number): string[] {
    const layout = this.roomAt(x, y);
    if (!layout) return [];
    return this.untakenItemsOf(layout)
      .filter((item) => item.x === x && item.y === y)
      .map((item) => {
        this.state.setOn(keyItemId(layout, item.id), true);
        return item.id;
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

  private untakenItemsOf(layout: PuzzleRoomLayout): RoomItem[] {
    return layout.items.filter((item) => !this.state.isOn(keyItemId(layout, item.id)));
  }

  private roomOpensGate(layout: PuzzleRoomLayout, side: DoorwaySide): boolean {
    if (layout.unlock !== 'key') return roomIsSolved(layout, this.state);
    return this.state.isOn(unlockedSideId(layout, side));
  }

  private unlockWithKey(
    layout: PuzzleRoomLayout,
    gate: PuzzleFixture,
    purse: KeyPurse,
  ): UseOutcome {
    if (!purse.spendKey()) {
      return { ok: false, code: 'no_key', hint: 'this door wants a key and your bag has none' };
    }
    this.state.setOn(unlockedSideId(layout, sideOfGate(layout, gate)), true);
    return { ok: true, summary: 'turned the key in the lock; the door swings open' };
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
      const done = this.fixtureReadsAsDone(layout, fixture);
      const look =
        fixture.kind === 'gate'
          ? gateLook(layout.unlock === 'key' ? 'key' : 'mechanism', done)
          : fixtureLook(fixture.kind, done);
      into.push({ x: at.x, y: at.y, ...look });
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
