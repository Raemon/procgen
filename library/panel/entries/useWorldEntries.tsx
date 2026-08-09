import { useSyncExternalStore } from 'react';
import { useAppRuntime } from '../../../frontend/appRuntimeContext';
import { useRerenderOnPipelineChange } from '../../../frontend/rerenderHooks';
import type { WorldPreset } from '../../../procgen/presets/worldPreset';
import { exampleWorlds } from '../../exampleWorlds';
import { CURRENT_WORLD_TIP, savedWorldTip } from '../../help/libraryTips';
import { CURRENT_WORLD } from '../../librarySelection';
import { WorldThumbnailIcon } from '../icons/WorldThumbnailIcon';
import { useThumbnailOfTheWorldBeingEdited } from '../icons/useWorldThumbnail';
import { exampleWorldKey, savedWorldKey } from '../../worldKeys';
import { worldThumbnails } from '../../worldThumbnails';
import type { LibraryEntry } from './libraryEntry';

type Perform = (action: string, params?: Record<string, unknown>) => unknown;

export function useWorldEntries(): LibraryEntry[] {
  const { perform, worldPresets } = useAppRuntime();
  useRerenderOnPipelineChange();
  useThumbnailOfTheWorldBeingEdited();
  const saved = useSyncExternalStore(
    (listener) => worldPresets.onChange(listener),
    () => worldPresets.savedPresets(),
  );
  return [
    theWorldBeingEdited(),
    ...saved.map((preset) => savedWorldEntry(preset, perform)),
    ...exampleWorlds().map((example) => exampleWorldEntry(example, perform)),
  ];
}

function theWorldBeingEdited(): LibraryEntry {
  return {
    key: CURRENT_WORLD,
    name: 'this world',
    icon: <WorldThumbnailIcon worldKey={CURRENT_WORLD} />,
    tip: CURRENT_WORLD_TIP,
  };
}

function savedWorldEntry(preset: WorldPreset, perform: Perform): LibraryEntry {
  const key = savedWorldKey(preset.name);
  return {
    key,
    name: `★ ${preset.name}`,
    icon: <WorldThumbnailIcon worldKey={key} />,
    tip: savedWorldTip(preset.name, preset.description, true),
    duplicate: () => perform('duplicate_preset', { name: preset.name }),
    remove: () => {
      perform('delete_preset', { name: preset.name });
      worldThumbnails.forget(key);
    },
  };
}

function exampleWorldEntry(example: WorldPreset, perform: Perform): LibraryEntry {
  return {
    key: exampleWorldKey(example.name),
    name: example.name,
    icon: <WorldThumbnailIcon worldKey={exampleWorldKey(example.name)} />,
    tip: savedWorldTip(example.name, example.description, false),
    duplicate: () => perform('duplicate_preset', { name: example.name }),
  };
}
