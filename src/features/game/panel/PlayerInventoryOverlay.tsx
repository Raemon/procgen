import { useEffect, useSyncExternalStore } from 'react';
import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import { useRerenderOnCreatureChange, useRerenderOnItemChange } from '@/features/app-shell/runtime/rerenderHooks';
import { playerCharacterDef } from '@/features/asset-library/characters/playerCharacter';
import { InventoryKeyInput } from '../input/inventoryKey';
import { DIM_READOUT_CLASSES } from '@/features/app-shell/controls/fieldClasses';
import { CarriedItemsGrid } from './CarriedItemsGrid';

export function PlayerInventoryOverlay() {
  const runtime = useAppRuntime();
  const { playerInventoryPanel, chatComposer, creatures, items } = runtime;
  const open = useSyncExternalStore(playerInventoryPanel.subscribe, playerInventoryPanel.isOpen);
  useRerenderOnCreatureChange();
  useRerenderOnItemChange();

  useEffect(() => {
    const keys = new InventoryKeyInput({
      panel: playerInventoryPanel,
      isSuspended: () => chatComposer.isOpen(),
    });
    return () => keys.dispose();
  }, [playerInventoryPanel, chatComposer]);

  if (!open) return null;
  const carrier = playerCharacterDef(creatures);
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/50">
      <div className="pointer-events-auto rounded border border-panel-edge bg-panel p-3 shadow-[0_6px_24px_rgba(0,0,0,0.6)]">
        <div className="mb-2 flex items-baseline gap-2">
          <span className="text-ink">{carrier?.name ?? 'no character'}</span>
          <span className={DIM_READOUT_CLASSES}>I or Esc closes</span>
        </div>
        {carrier?.inventory ? (
          <CarriedItemsGrid inventory={carrier.inventory} items={items} />
        ) : (
          <p className={DIM_READOUT_CLASSES}>This character has no bag to carry anything in.</p>
        )}
      </div>
    </div>
  );
}
