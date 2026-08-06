import type { ChunkGenCtx } from '../../nodeType';

export type SiteTest = (worldX: number, worldY: number) => boolean;

export function winsSpacingContest(
  ctx: ChunkGenCtx,
  site: SiteTest,
  worldX: number,
  worldY: number,
  spacing: number,
  rankLabel: string,
): boolean {
  const myRank = ctx.hash01(worldX, worldY, rankLabel);
  for (let dy = -spacing; dy <= spacing; dy++) {
    for (let dx = -spacing; dx <= spacing; dx++) {
      if (dx === 0 && dy === 0) continue;
      if (dx * dx + dy * dy > spacing * spacing) continue;
      if (!site(worldX + dx, worldY + dy)) continue;
      if (ctx.hash01(worldX + dx, worldY + dy, rankLabel) < myRank) return false;
    }
  }
  return true;
}
