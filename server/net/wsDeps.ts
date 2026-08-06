import type { ServerConfig } from '../config';
import type { EntityRegistry } from '../game/entities';
import type { GameLoop } from '../game/gameLoop';
import type { SnapshotFeed } from '../game/snapshotFeed';
import type { WorldHost } from '../game/worldHost';
import type { Store } from '../persist/db';
import type { WriteBehind } from '../persist/writeBehind';
import type { Connection } from './connection';

export interface WsDeps {
  config: ServerConfig;
  store: Store;
  registry: EntityRegistry;
  feed: SnapshotFeed;
  loop: GameLoop;
  connections: Set<Connection>;
  worldHost: WorldHost;
  writeBehind: WriteBehind;
}
