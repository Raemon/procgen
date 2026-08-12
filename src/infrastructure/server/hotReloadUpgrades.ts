import type { UpgradeHandler } from '@/features/game/multiplayer/host/wsServer';

export function hotReloadUpgradesBelongToNextInDev(
  dev: boolean,
  handleNextUpgrade: UpgradeHandler,
): UpgradeHandler {
  return (req, socket, head) =>
    dev ? handleNextUpgrade(req, socket, head) : socket.destroy();
}
