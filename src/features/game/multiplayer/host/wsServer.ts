import type { IncomingMessage, Server } from 'node:http';
import type { Duplex } from 'node:stream';
import { WebSocketServer, type RawData, type WebSocket } from 'ws';
import { decodeClient } from '../client/codec';
import {
  JUMP_IN_PLACE,
  Op,
  PROTOCOL_VERSION,
  type ClientMsg,
  type HelloMsg,
  type SayMsg,
} from '../client/protocol';
import { sanitizeChatText } from '../../chat/sanitizeChatText';
import { useHereOrAhead } from '../../puzzles/interaction/useAtPose';
import {
  ORDER_DIR,
  ORDER_NONE,
  holdDirection,
  isDirIndex,
  releaseOrder,
  requestJump,
} from '../../sim/movementOrder';
import { turnedFacing } from '../../facing';
import { joinConnection, leaveConnection } from '../game/joins';
import { Connection } from './connection';
import {
  characterIdOfRequest,
  mintCharacterId,
  sessionCookieHeaderFor,
} from './sessionCookie';
import { takeSayAllowance } from './sayAllowance';
import type { WsDeps } from './wsDeps';

const HELLO_TIMEOUT_MS = 5000;
const HEARTBEAT_MS = 20_000;
const MAX_INPUT_VIOLATIONS = 100;

export const GAME_SOCKET_PATH = '/api/v1/game/socket';

export type UpgradeHandler = (req: IncomingMessage, socket: Duplex, head: Buffer) => unknown;

export function attachWebSocket(
  httpServer: Server,
  deps: WsDeps,
  handleUpgradeTheGameDoesNotOwn: UpgradeHandler,
): () => void {
  const wss = new WebSocketServer({ noServer: true });
  const freshlyMinted = new WeakMap<object, string>();
  wss.on('headers', (headers, req) => {
    const minted = freshlyMinted.get(req);
    if (minted) headers.push(sessionCookieHeaderFor(deps.config.serverSecret, minted));
  });
  httpServer.on('upgrade', (req, socket, head) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    if (url.pathname !== GAME_SOCKET_PATH) {
      handleUpgradeTheGameDoesNotOwn(req, socket, head);
      return;
    }
    const known = characterIdOfRequest(deps.config.serverSecret, req);
    const characterId = known ?? mintCharacterId();
    if (!known) freshlyMinted.set(req, characterId);
    wss.handleUpgrade(req, socket, head, (ws) => acceptSocket(ws, characterId, deps));
  });
  const heartbeat = setInterval(() => pingAll(deps), HEARTBEAT_MS);
  return () => {
    clearInterval(heartbeat);
    wss.close();
  };
}

function acceptSocket(ws: WebSocket, characterId: string, deps: WsDeps): void {
  const conn = new Connection(ws, characterId);
  deps.connections.add(conn);
  conn.helloTimer = setTimeout(() => conn.kick('abuse', 'hello timeout'), HELLO_TIMEOUT_MS);
  ws.on('pong', () => (conn.alive = true));
  ws.on('message', (data: RawData, isBinary: boolean) => {
    if (isBinary) return;
    const msg = decodeClient(data.toString());
    if (msg) handleMessage(conn, msg, deps);
  });
  ws.on('close', () => {
    if (conn.helloTimer) clearTimeout(conn.helloTimer);
    leaveConnection(conn, deps);
  });
  ws.on('error', () => undefined);
}

function handleMessage(conn: Connection, msg: ClientMsg, deps: WsDeps): void {
  if (Array.isArray(msg)) {
    if (conn.state === 'PLAYING' && conn.entity) handleAction(conn, msg, deps);
    return;
  }
  if (msg.t === 'hello' && conn.state === 'AWAITING_HELLO') handleHello(conn, msg, deps);
  if (conn.state !== 'PLAYING' || !conn.entity) return;
  if (msg.t === 'say') handleSay(conn, msg, deps);
  if (msg.t === 'use') useHereOrAhead(deps.worldHost.current().puzzles, conn.entity.x, conn.entity.y, conn.entity.facing);
  if (msg.t === 'resetRoom') deps.worldHost.current().puzzles.resetRoomAt(conn.entity.x, conn.entity.y);
}

function handleHello(conn: Connection, hello: HelloMsg, deps: WsDeps): void {
  if (conn.helloTimer) clearTimeout(conn.helloTimer);
  if (hello.v !== PROTOCOL_VERSION) {
    conn.kick('version', `server speaks protocol v${PROTOCOL_VERSION}`);
    return;
  }
  void joinConnection(conn, deps).catch((err) => {
    console.error('[ws] join failed', err);
    conn.kick('abuse', 'join failed');
  });
}

function handleSay(conn: Connection, msg: SayMsg, deps: WsDeps): void {
  const text = sanitizeChatText(msg.text);
  if (text === '') return;
  if (!takeSayAllowance(conn.sayAllowance, Date.now())) return;
  deps.chat.broadcastSaid(conn.entity!.id, text);
}

function handleAction(conn: Connection, msg: number[], deps: WsDeps): void {
  const accepted =
    msg[0] === Op.Order
      ? applyOrder(conn, msg[1], msg[2])
      : msg[0] === Op.Turn
        ? applyTurn(conn, msg[1], deps)
        : msg[0] === Op.Jump
          ? applyJump(conn, msg[1])
          : false;
  if (accepted) {
    conn.inputViolations = 0;
    return;
  }
  if (++conn.inputViolations > MAX_INPUT_VIOLATIONS) conn.kick('abuse', 'invalid input flood');
}

function applyOrder(conn: Connection, kind: unknown, dir: unknown): boolean {
  const entity = conn.entity!;
  if (kind === ORDER_NONE) {
    releaseOrder(entity);
    return true;
  }
  if (kind === ORDER_DIR && isDirIndex(dir)) {
    holdDirection(entity, dir);
    return true;
  }
  return false;
}

function applyJump(conn: Connection, dir: unknown): boolean {
  if (dir === JUMP_IN_PLACE) {
    requestJump(conn.entity!, null);
    return true;
  }
  if (!isDirIndex(dir)) return false;
  requestJump(conn.entity!, dir);
  return true;
}

function applyTurn(conn: Connection, eighthTurns: unknown, deps: WsDeps): boolean {
  if (eighthTurns !== 1 && eighthTurns !== -1) return false;
  const entity = conn.entity!;
  deps.registry.faceToward(entity, turnedFacing(entity.facing, eighthTurns));
  return true;
}

function pingAll(deps: WsDeps): void {
  for (const conn of deps.connections) {
    if (!conn.alive) {
      conn.ws.terminate();
      continue;
    }
    conn.alive = false;
    conn.ws.ping();
  }
}
