import { useAppRuntime } from '../../../frontend/appRuntimeContext';
import { DrawerPanel } from '../../../frontend/controls/DrawerPanel';
import { KnobRow } from '../../../frontend/controls/KnobRow';
import { Select } from '../../../frontend/controls/Select';
import { tileSelectOptions } from '../../../frontend/controls/tileSelectOptions';
import { PanelHint } from '../../../frontend/help/PanelHint';
import { useRerenderOnTileAssetChange } from '../../../frontend/rerenderHooks';
import type { Culture } from '../cultureDef';
import { CULTURE_TILE_SLOTS, tileChosenForSlot } from '../cultureTileSlots';
import { cultureTileSlotTip } from './help/cultureTips';

export function CultureTileChoices({ culture }: { culture: Culture }) {
  const { perform, tileAssets } = useAppRuntime();
  useRerenderOnTileAssetChange();
  const chooseTile = (param: string, tileId: number) =>
    perform('set_culture_tiles', { culture_id: culture.id, [param]: tileId });
  return (
    <DrawerPanel>
      {CULTURE_TILE_SLOTS.map((slot) => (
        <KnobRow key={slot.param} label={slot.label} tip={cultureTileSlotTip(slot)}>
          <Select
            value={String(tileChosenForSlot(culture, slot))}
            options={tileSelectOptions(tileAssets, '(none)')}
            onChange={(value) => chooseTile(slot.param, Number(value))}
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
