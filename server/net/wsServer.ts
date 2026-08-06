import type { Server } from 'node:http';
import { WebSocketServer, type RawData, type WebSocket } from 'ws';
import { decodeClient } from '../../src/net/codec';
import { Op, PROTOCOL_VERSION, type ClientMsg, type HelloMsg } from '../../src/net/protocol';
import {
  ORDER_DIR,
  ORDER_NONE,
  holdDirection,
  isDirIndex,
  releaseOrder,
} from '../../src/sim/movementOrder';
import { turnedFacing } from '../../src/world/facing';
import { joinConnection, leaveConnection } from '../game/joins';
import { Connection } from './connection';
import type { WsDeps } from './wsDeps';

const HELLO_TIMEOUT_MS = 5000;
const HEARTBEAT_MS = 20_000;
const MAX_INPUT_VIOLATIONS = 100;

export function attachWebSocket(httpServer: Server, deps: WsDeps): () => void {
  const wss = new WebSocketServer({ noServer: true });
  httpServer.on('upgrade', (req, socket, head) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    if (url.pathname !== '/ws') {
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => acceptSocket(ws, deps));
  });
  const heartbeat = setInterval(() => pingAll(deps), HEARTBEAT_MS);
  return () => {
    clearInterval(heartbeat);
    wss.close();
  };
}

function acceptSocket(ws: WebSocket, deps: WsDeps): void {
  const conn = new Connection(ws);
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
}

function handleHello(conn: Connection, hello: HelloMsg, deps: WsDeps): void {
  if (conn.helloTimer) clearTimeout(conn.helloTimer);
  if (hello.v !== PROTOCOL_VERSION) {
    conn.kick('version', `server speaks protocol v${PROTOCOL_VERSION}`);
    return;
  }
  void joinConnection(conn, hello, deps).catch((err) => {
    console.error('[ws] join failed', err);
    conn.kick('abuse', 'join failed');
  });
}

function handleAction(conn: Connection, msg: number[], deps: WsDeps): void {
  const accepted =
    msg[0] === Op.Order ? applyOrder(conn, msg[1], msg[2]) : msg[0] === Op.Turn ? applyTurn(conn, msg[1], deps) : false;
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
