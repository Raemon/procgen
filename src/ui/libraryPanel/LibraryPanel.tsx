import { useEffect, useState } from 'react';
import { useAppRuntime } from '../../app/appRuntimeContext';
import { CreaturesTab } from '../creatureEditor/CreaturesTab';
import { PrefabsTab } from '../prefabEditor/PrefabsTab';
import { TilesTab } from '../tileEditor/TilesTab';
import { LibraryTabs, type LibraryTab } from './LibraryTabs';

export function LibraryPanel() {
  const { prefabs } = useAppRuntime();
  const [tab, setTab] = useState<LibraryTab>('tiles');
  useEffect(() => prefabs.onPrefabAdded(() => setTab('prefabs')), [prefabs]);
  return (
    <>
      <LibraryTabs tab={tab} onSelect={setTab} />
      {tab === 'tiles' && <TilesTab />}
      {tab === 'prefabs' && <PrefabsTab />}
      {tab === 'creatures' && <CreaturesTab />}
    </>
  );
}
