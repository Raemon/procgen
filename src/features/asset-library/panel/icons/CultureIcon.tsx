import type { Culture } from '@/features/asset-library/cultures/cultureDef';
import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import { AssetIconFrame } from './AssetIconFrame';

const UNCHOSEN_TILE = '#00000000';

export function CultureIcon({ culture }: { culture: Culture }) {
  const { tileAssets } = useAppRuntime();
  const colorOf = (tileId: number) => tileAssets.byId(tileId)?.color ?? UNCHOSEN_TILE;
  return (
    <AssetIconFrame>
      <span className="grid h-full w-full grid-cols-2 grid-rows-2">
        {buildingMaterialsOf(culture).map((tileId, corner) => (
          <span key={corner} style={{ backgroundColor: colorOf(tileId) }} />
        ))}
      </span>
    </AssetIconFrame>
  );
}

function buildingMaterialsOf(culture: Culture): number[] {
  return [culture.roofSlopeTileId, culture.roofRidgeTileId, culture.wallTileId, culture.floorTileId];
}
