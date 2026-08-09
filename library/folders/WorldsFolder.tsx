import { useSyncExternalStore } from 'react';
import { useAppRuntime } from '../../frontend/appRuntimeContext';
import { useRerenderOnPipelineChange } from '../../frontend/rerenderHooks';
import { exampleWorlds } from '../exampleWorlds';
import { CURRENT_WORLD_TIP, FOLDER_TIPS, savedWorldTip } from '../help/libraryTips';
import { CURRENT_WORLD } from '../librarySelection';
import { exampleWorldKey, savedWorldKey } from '../worldKeys';
import { LibraryFolder } from '../panel/LibraryFolder';
import { LibraryRow } from '../panel/LibraryRow';

export function WorldsFolder() {
  const { store, worldPresets } = useAppRuntime();
  useRerenderOnPipelineChange();
  const saved = useSyncExternalStore(
    (listener) => worldPresets.onChange(listener),
    () => worldPresets.savedPresets(),
  );
  const examples = exampleWorlds();
  return (
    <LibraryFolder
      folder="worlds"
      label="worlds"
      tip={FOLDER_TIPS.worlds}
      count={1 + saved.length + examples.length}
    >
      <LibraryRow
        folder="worlds"
        entryKey={CURRENT_WORLD}
        name="this world"
        note={`${store.nodes().length} nodes`}
        tip={CURRENT_WORLD_TIP}
      />
      {saved.map((preset) => (
        <LibraryRow
          key={preset.name}
          folder="worlds"
          entryKey={savedWorldKey(preset.name)}
          name={`★ ${preset.name}`}
          note={`${preset.state.nodes.length}`}
          tip={savedWorldTip(preset.name, preset.description, true)}
        />
      ))}
      {examples.map((example) => (
        <LibraryRow
          key={example.name}
          folder="worlds"
          entryKey={exampleWorldKey(example.name)}
          name={example.name}
          note={`${example.state.nodes.length}`}
          tip={savedWorldTip(example.name, example.description, false)}
        />
      ))}
    </LibraryFolder>
  );
}
