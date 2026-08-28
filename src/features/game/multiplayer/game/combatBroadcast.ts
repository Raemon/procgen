import { combatEventText, type CombatEvent } from '../../creatureSim/combatEvents';
import type { Connection } from '../host/connection';
import type { ServerMsg } from '../client/protocol';
import type { WorldHost } from './worldHost';

export function attachCombatBroadcast(
  worldHost: WorldHost,
  connections: Set<Connection>,
): () => void {
  return worldHost.onCombat((event) => {
    if (event.kind === 'creature_slain') dropLootAndShareDeath(worldHost, connections, event);
    broadcast(connections, { t: 'combat', text: combatEventText(event) });
  });
}

export function sendWorldDivergencesTo(conn: Connection, worldHost: WorldHost): void {
  const world = worldHost.current();
  conn.send({ t: 'slain', keys: world.slainCreatures.snapshot(), all: true });
  conn.send(droppedMsgOf(worldHost));
}

function dropLootAndShareDeath(
  worldHost: WorldHost,
  connections: Set<Connection>,
  event: Extract<CombatEvent, { kind: 'creature_slain' }>,
): void {
  const world = worldHost.current();
  for (const itemId of event.droppedItemIds) {
    world.droppedItems.drop({ x: event.x, y: event.y, itemId });
  }
  broadcast(connections, { t: 'slain', keys: [event.creatureKey] });
  broadcast(connections, droppedMsgOf(worldHost));
}

export function droppedMsgOf(worldHost: WorldHost): ServerMsg {
  return {
    t: 'dropped',
    drops: worldHost.current().droppedItems.snapshot().map((drop) => [drop.x, drop.y, drop.itemId]),
  };
}

function broadcast(connections: Set<Connection>, msg: ServerMsg): void {
  for (const conn of connections) {
    if (conn.state === 'PLAYING') conn.send(msg);
  }
}
