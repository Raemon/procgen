import type { ReadOnlyPipelineStore } from '@/features/app-shell/runtime/readOnlyAssets';
import { KEY_ITEM_ID } from '@/features/asset-library/items/defaultItems';
import { NO_ITEMS, type ItemSource } from '@/features/asset-library/items/itemAssets';
import type { ItemSpawn, Marker } from '@/features/asset-library/worlds/worldSampler';
import { circuitTouches, type Circuit } from '@/features/game/circuits/circuit';
import type { PuzzleFixture } from '@/features/game/fixtures/fixtureKinds';
import { NO_KEYS, type KeyPurse } from '@/features/game/fixtures/keyPurse';
import { nothingToUse } from '@/features/game/fixtures/useOutcome';
import type { Cell } from '@/features/game/worldRules';
import { stepEntersTheRoom, type PuzzleRoomLayout } from '../generate/rooms/puzzleRoomLayout';
import { fixtureAction } from '../play/fixtureAction';
import {
  crateCanBePushed,
  pushCrate,
  type CrateShove,
  type WalkableProbe,
} from '../play/pushCrate';
import { reportDoor, useFixture, type UseOutcome } from '../play/useFixture';
import { roomCircuitOf, routedWiresOf } from './circuits';
import { keySpawnsIn, pocketKeysAt } from './keysInRooms';
import { roomMarkersOf } from './markers';
import { puzzleKnobsOfNode } from './puzzleKnobs';
import { RoomAtlas } from './roomAtlas';
import { crateCellsIn, fixtureAt, whatBlocksAt } from './roomFixtures';
import { gateStandsOpen, unlockWithKey } from './roomGates';
import { fixtureIsOn } from './state/fixtureSignals';
import { PuzzleState } from './state/puzzleState';

export class PuzzleWorld {
  private readonly atlas: RoomAtlas;
  private readonly wires = new WeakMap<PuzzleRoomLayout, Cell[]>();

  constructor(
    store: ReadOnlyPipelineStore,
    readonly nodeId: string,
    private readonly tileIsWalkable: WalkableProbe,
    readonly state: PuzzleState = new PuzzleState(),
    private readonly items: ItemSource = NO_ITEMS,
  ) {
    this.atlas = new RoomAtlas(puzzleKnobsOfNode(store, nodeId));
  }

  isActive(): boolean {
    return this.atlas.isActive();
  }

  roomAt(x: number, y: number): PuzzleRoomLayout | null {
    return this.atlas.at(x, y);
  }

  markersIn(minX: number, minY: number, maxX: number, maxY: number): Marker[] {
    return this.atlas
      .overlapping(minX, minY, maxX, maxY)
      .flatMap((layout) => roomMarkersOf(this, layout, minX, minY, maxX, maxY));
  }

  circuitsIn(minX: number, minY: number, maxX: number, maxY: number): Circuit[] {
    return this.atlas
      .overlapping(minX, minY, maxX, maxY)
      .map((layout) => roomCircuitOf(this, layout))
      .filter((circuit): circuit is Circuit => circuit !== null && circuitTouches(circuit, minX, minY, maxX, maxY));
  }

  cratesIn(minX: number, minY: number, maxX: number, maxY: number): Cell[] {
    return this.atlas
      .overlapping(minX, minY, maxX, maxY)
      .flatMap((layout) => crateCellsIn(layout, this.state, minX, minY, maxX, maxY));
  }

  itemSpawnsIn(minX: number, minY: number, maxX: number, maxY: number): ItemSpawn[] {
    const key = this.items.byId(KEY_ITEM_ID);
    if (!key) return [];
    return this.atlas
      .overlapping(minX, minY, maxX, maxY)
      .flatMap((layout) => keySpawnsIn(layout, this.state, key, minX, minY, maxX, maxY));
  }

  takeSpawn(spawn: ItemSpawn): boolean {
    return spawn.itemId === KEY_ITEM_ID && this.takeKeysAt(spawn.x, spawn.y).length > 0;
  }

  takeKeysAt(x: number, y: number): string[] {
    const layout = this.atlas.at(x, y);
    return layout ? pocketKeysAt(layout, this.state, x, y) : [];
  }

  blocksAt(x: number, y: number): boolean {
    const layout = this.atlas.at(x, y);
    return layout !== null && this.blockerAt(layout, x, y) !== null;
  }

  clearTheWay(x: number, y: number, dx: number, dy: number, mayPush = true): boolean {
    return this.wayThrough(x, y, dx, dy, mayPush, pushCrate);
  }

  couldClearTheWay(x: number, y: number, dx: number, dy: number, mayPush = true): boolean {
    return this.wayThrough(x, y, dx, dy, mayPush, crateCanBePushed);
  }

  actionAt(x: number, y: number): string | null {
    const layout = this.atlas.at(x, y);
    const fixture = layout && fixtureAt(layout, this.state, x, y);
    if (!layout || !fixture) return null;
    if (fixture.kind === 'gate' && !this.gateIsOpen(layout, fixture)) {
      return layout.unlock === 'key' ? 'unlock the door with a key' : 'try the barred door';
    }
    return fixtureAction(fixture.kind, this.fixtureReadsAsDone(layout, fixture));
  }

  use(x: number, y: number, purse: KeyPurse = NO_KEYS): UseOutcome {
    const layout = this.atlas.at(x, y);
    const fixture = layout && fixtureAt(layout, this.state, x, y);
    if (!layout || !fixture) return nothingToUse(x, y);
    if (fixture.kind !== 'gate') return useFixture(layout, this.state, fixture);
    if (this.gateIsOpen(layout, fixture)) return reportDoor(layout, this.state, true);
    if (layout.unlock !== 'key') return reportDoor(layout, this.state, false);
    return unlockWithKey(this.state, layout, fixture, purse);
  }

  gateIsOpen(layout: PuzzleRoomLayout, gate: PuzzleFixture): boolean {
    return gateStandsOpen(this.atlas, this.state, layout, gate);
  }

  fixtureReadsAsDone(layout: PuzzleRoomLayout, fixture: PuzzleFixture): boolean {
    return fixture.kind === 'gate'
      ? this.gateIsOpen(layout, fixture)
      : fixtureIsOn(layout, this.state, fixture);
  }

  resetRoomAt(x: number, y: number): PuzzleRoomLayout | null {
    const layout = this.atlas.at(x, y);
    if (layout) this.state.forgetRoom(layout.key);
    return layout;
  }

  wiresOf(layout: PuzzleRoomLayout, signals: PuzzleFixture[], gates: PuzzleFixture[]): Cell[] {
    const known = this.wires.get(layout);
    if (known) return known;
    const routed = routedWiresOf(layout, signals, gates, this.tileIsWalkable);
    this.wires.set(layout, routed);
    return routed;
  }

  private wayThrough(
    x: number,
    y: number,
    dx: number,
    dy: number,
    mayPush: boolean,
    shove: CrateShove,
  ): boolean {
    const layout = this.atlas.at(x, y);
    if (!layout) return true;
    const blocker = this.blockerAt(layout, x, y);
    if (!blocker) return true;
    if (blocker.kind === 'gate') return stepEntersTheRoom(layout, blocker, dx, dy);
    if (blocker.kind !== 'crate' || !mayPush) return false;
    return shove(layout, this.state, blocker, dx, dy, this.tileIsWalkable);
  }

  private blockerAt(layout: PuzzleRoomLayout, x: number, y: number): PuzzleFixture | null {
    return whatBlocksAt(layout, this.state, x, y, (room, gate) => this.gateIsOpen(room, gate));
  }
}
