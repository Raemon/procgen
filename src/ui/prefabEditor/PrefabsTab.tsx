import { useEffect } from 'react';
import { useAppRuntime } from '../../app/appRuntimeContext';
import { useRerenderOnPrefabChange } from '../../app/rerenderHooks';
import { Button } from '../controls/Button';
import { classes } from '../controls/classes';
import { HINT_CLASSES } from '../controls/fieldClasses';
import { isNumberOrNull } from '../uiState/persistedUiGuards';
import { PERSISTED_UI_KEYS } from '../uiState/persistedUiKeys';
import { usePersistedUiValue } from '../uiState/usePersistedUiValue';
import { PrefabRow } from './PrefabRow';

export function PrefabsTab() {
  const { prefabs, perform } = useAppRuntime();
  const [openId, setOpenId] = usePersistedUiValue<number | null>(
    PERSISTED_UI_KEYS.openPrefabId,
    null,
    isNumberOrNull,
  );
  useRerenderOnPrefabChange();
  useEffect(() => prefabs.onPrefabAdded((prefab) => setOpenId(prefab.id)), [prefabs]);
  return (
    <>
      {prefabs.all().map((prefab) => (
        <PrefabRow
          key={prefab.id}
          prefab={prefab}
          open={openId === prefab.id}
          onToggle={() => setOpenId(openId === prefab.id ? null : prefab.id)}
        />
      ))}
      <Button className="mt-2" onClick={() => perform('add_prefab')}>
        + add prefab
      </Button>
      <p className={classes(HINT_CLASSES, 'mt-2')}>
        Prefabs are voxel stamps: layer 1 is the ground cell, higher layers stack upward. Bind them
        to any points node with display “prefabs” to scatter them through the world, or press
        capture in the world view and drag a rectangle to lift a section of the world into a new
        prefab.
      </p>
    </>
  );
}
