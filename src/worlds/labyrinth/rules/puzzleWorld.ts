import { labyrinthCellCoordOf, labyrinthCellKey } from '../generate/layout/labyrinthLattice';
import { cellWithin, circuitTouches, type Circuit } from '@/features/game/circuits/circuit';
import type { LabyrinthKnobs } from '../node/labyrinthKnobs';
import { NO_ITEMS, type ItemSource } from '@/features/asset-library/items/itemAssets';
import { KEY_ITEM_ID } from '@/features/asset-library/items/defaultItems';
import type { DoorwaySide } from '../generate/layout/roomLayout';
import type { ItemSpawn, Marker } from '@/features/asset-library/worlds/worldSampler';
import type { ReadOnlyPipelineStore } from '@/features/app-shell/runtime/readOnlyAssets';
import type { Cell } from '@/features/game/worldRules';
import type { PuzzleFixture } from '@/features/game/fixtures/fixtureKinds';
import { fixtureAction } from '../play/fixtureAction';
import { crateCanBePushed, pushCrate, type WalkableProbe } from '../play/pushCrate';
import { NO_KEYS, type KeyPurse } from '@/features/game/fixtures/keyPurse';
import { reportDoor, useFixture, type UseOutcome } from '../play/useFixture';
import { puzzleKnobsOfNode } from './puzzleKnobs';
import { buildPuzzleRoom } from '../generate/rooms/buildPuzzleRoom';
import { RoomCache } from '../generate/rooms/roomCache';
import {
  everyFixtureOf,
  oppositeSide,
  roomAcrossTheGate,
  sideOfGate,
  stepEntersTheRoom,
  type PuzzleRoomLayout,
} from '../generate/rooms/puzzleRoomLayout';
import type { RoomItem } from '../generate/rooms/roomItem';
import { fixtureIsOn, livePosition, roomIsSolved } from './state/fixtureSignals';
import { keyItemId, unlockedSideId } from './state/roomKeys';
import { PuzzleState } from './state/puzzleState';
import { roomCircuitOf, routedWiresOf } from './circuits';
import { roomMarkersOf } from './markers';

const ROOMS_KEPT = 512;

function isFurniture(fixture: PuzzleFixture): boolean {
  return fixture.kind === 'crate' || fixture.kind === 'pillar';
}

export class PuzzleWorld {
  private readonly rooms = new RoomCache(ROOMS_KEPT);
  private readonly wires = new WeakMap<PuzzleRoomLayout, Cell[]>();
  private readonly knobs: LabyrinthKnobs | null;

  constructor(
    store: ReadOnlyPipelineStore,
    readonly nodeId: string,
    private readonly tileIsWalkable: WalkableProbe,
    readonly state: PuzzleState = new PuzzleState(),
    private readonly items: ItemSource = NO_ITEMS,
  ) {
    this.knobs = puzzleKnobsOfNode(store, nodeId);
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
    return this.roomsOverlapping(minX, minY, maxX, maxY).flatMap((layout) =>
      roomMarkersOf(this, layout, minX, minY, maxX, maxY),
    );
  }

  circuitsIn(minX: number, minY: number, maxX: number, maxY: number): Circuit[] {
    if (!this.knobs) return [];
    return this.roomsOverlapping(minX, minY, maxX, maxY)
      .map((layout) => roomCircuitOf(this, layout))
      .filter((circuit): circuit is Circuit => circuit !== null && circuitTouches(circuit, minX, minY, maxX, maxY));
  }

  cratesIn(minX: number, minY: number, maxX: number, maxY: number): Cell[] {
    if (!this.knobs) return [];
    return this.roomsOverlapping(minX, minY, maxX, maxY).flatMap((layout) =>
      layout.fixtures
        .filter((fixture) => fixture.kind === 'crate')
        .map((crate) => livePosition(layout, this.state, crate))
        .filter((at) => cellWithin(at, minX, minY, maxX, maxY)),
    );
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

  blocksTheWayInAt(x: number, y: number): boolean {
    const layout = this.roomAt(x, y);
    return layout !== null && this.furnitureAt(layout, x, y) !== null;
  }

  clearTheWay(x: number, y: number, dx: number, dy: number, mayPush = true): boolean {
    const layout = this.roomAt(x, y);
    if (!layout) return true;
    const blocker = this.blockerAt(layout, x, y);
    if (!blocker) return true;
    if (blocker.kind === 'gate') return stepEntersTheRoom(layout, blocker, dx, dy);
    if (blocker.kind !== 'crate' || !mayPush) return false;
    return pushCrate(layout, this.state, blocker, dx, dy, this.tileIsWalkable);
  }

  couldClearTheWay(x: number, y: number, dx: number, dy: number, mayPush = true): boolean {
    const layout = this.roomAt(x, y);
    if (!layout) return true;
    const blocker = this.blockerAt(layout, x, y);
    if (!blocker) return true;
    if (blocker.kind === 'gate') return stepEntersTheRoom(layout, blocker, dx, dy);
    if (blocker.kind !== 'crate' || !mayPush) return false;
    return crateCanBePushed(layout, this.state, blocker, dx, dy, this.tileIsWalkable);
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

  wiresOf(layout: PuzzleRoomLayout, signals: PuzzleFixture[], gates: PuzzleFixture[]): Cell[] {
    const known = this.wires.get(layout);
    if (known) return known;
    const routed = routedWiresOf(layout, signals, gates, this.tileIsWalkable);
    this.wires.set(layout, routed);
    return routed;
  }

  private untakenItemsOf(layout: PuzzleRoomLayout): RoomItem[] {
    return layout.items.filter((item) => !this.state.isOn(keyItemId(layout, item.id)));
  }

  private roomOpensGate(layout: PuzzleRoomLayout, side: DoorwaySide): boolean {
    if (layout.gates[side].length === 0) return false;
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

  fixtureReadsAsDone(layout: PuzzleRoomLayout, fixture: PuzzleFixture): boolean {
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

  private furnitureAt(layout: PuzzleRoomLayout, x: number, y: number): PuzzleFixture | null {
    return this.fixturesAt(layout, x, y).find(isFurniture) ?? null;
  }

  private standsInTheWay(layout: PuzzleRoomLayout, fixture: PuzzleFixture): boolean {
    if (isFurniture(fixture)) return true;
    return fixture.kind === 'gate' && !this.gateIsOpen(layout, fixture);
  }
}
