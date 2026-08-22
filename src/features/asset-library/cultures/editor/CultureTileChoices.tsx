import { assetId } from '@/features/asset-library/asset';
import type { TileId } from '@/features/asset-library/asset';
import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import { DrawerPanel } from '@/features/app-shell/controls/DrawerPanel';
import { KnobRow } from '@/features/app-shell/controls/KnobRow';
import { Select } from '@/features/app-shell/controls/Select';
import { tileSelectOptions } from '@/features/app-shell/controls/tileSelectOptions';
import { PanelHint } from '@/features/app-shell/help/PanelHint';
import { useRerenderOnTileAssetChange } from '@/features/app-shell/runtime/rerenderHooks';
import type { Culture } from '../cultureDef';
import { CULTURE_TILE_SLOTS, tileChosenForSlot } from '../cultureTileSlots';
import { cultureTileSlotTip } from './help/cultureTips';

export function CultureTileChoices({ culture }: { culture: Culture }) {
  const { perform, tileAssets } = useAppRuntime();
  useRerenderOnTileAssetChange();
  const chooseTile = (param: string, tileId: TileId) =>
    perform('set_culture_tiles', { culture_id: culture.id, [param]: tileId });
  return (
    <DrawerPanel>
      {CULTURE_TILE_SLOTS.map((slot) => (
        <KnobRow key={slot.param} label={slot.label} tip={cultureTileSlotTip(slot)}>
          <Select
            value={String(tileChosenForSlot(culture, slot))}
            options={tileSelectOptions(tileAssets, '(none)')}
            onChange={(value) => chooseTile(slot.param, assetId<'tiles'>(Number(value)))}
          />
        </KnobRow>
      ))}
      <PanelHint>
        A slot left at (none) simply goes unpainted, so a culture can be all roof and no walls if
        that is what you want.
      </PanelHint>
    </DrawerPanel>
  );
}
