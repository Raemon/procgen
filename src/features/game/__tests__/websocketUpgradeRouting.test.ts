import assert from 'node:assert';
import { createServer, type IncomingMessage } from 'node:http';
import { PassThrough, type Duplex } from 'node:stream';
import { test } from 'node:test';
import { GAME_SOCKET_PATH, attachWebSocket } from '@/features/game/multiplayer/host/wsServer';
import type { WsDeps } from '@/features/game/multiplayer/host/wsDeps';
import { hotReloadUpgradesBelongToNextInDev } from '@/infrastructure/server/hotReloadUpgrades';

const HOT_RELOAD_UPGRADE = '/_next/hmr?id=abc';

export function websocketUpgradeRoutingTests(): void {
  test('an upgrade the game does not own goes to the handler that owns it, not to a destroyed socket', () => {
    const routed = upgradesRoutedFor(HOT_RELOAD_UPGRADE);
    assert.deepEqual(routed.handedOff, [HOT_RELOAD_UPGRADE]);
    assert.equal(routed.socketWasDestroyed, false);
  });

  test('the game socket upgrade is kept by the game and never handed off', () => {
    assert.deepEqual(upgradesRoutedFor(GAME_SOCKET_PATH).handedOff, []);
  });

  test('hot reload upgrades reach Next in development', () => {
    const reached: string[] = [];
    const socket = destroyableSocket();
    hotReloadUpgradesBelongToNextInDev(true, (req) => reached.push(req.url ?? ''))(
      upgradeRequestFor(HOT_RELOAD_UPGRADE),
      socket as unknown as Duplex,
      Buffer.alloc(0),
    );
    assert.deepEqual(reached, [HOT_RELOAD_UPGRADE]);
    assert.equal(socket.destroyed, false);
  });

  test('a production server has no hot reload to serve, so the upgrade is refused', () => {
    const socket = destroyableSocket();
    hotReloadUpgradesBelongToNextInDev(false, () => assert.fail('production has no Next upgrade'))(
      upgradeRequestFor(HOT_RELOAD_UPGRADE),
      socket as unknown as Duplex,
      Buffer.alloc(0),
    );
    assert.equal(socket.destroyed, true);
  });
}

function upgradesRoutedFor(path: string): { handedOff: string[]; socketWasDestroyed: boolean } {
  const handedOff: string[] = [];
  const server = createServer();
  const detach = attachWebSocket(server, wsDepsForRouting(), (req) => handedOff.push(req.url ?? ''));
  const socket = new PassThrough();
  server.emit('upgrade', upgradeRequestFor(path), socket, Buffer.alloc(0));
  detach();
  return { handedOff, socketWasDestroyed: socket.destroyed };
}

function upgradeRequestFor(path: string): IncomingMessage {
  return { url: path, headers: {} } as IncomingMessage;
}

function destroyableSocket(): { destroyed: boolean; destroy(): void } {
  return {
    destroyed: false,
    destroy() {
      this.destroyed = true;
    },
  };
}

function wsDepsForRouting(): WsDeps {
  return { config: { serverSecret: 'routing-test-secret' }, connections: new Set() } as WsDeps;
}
