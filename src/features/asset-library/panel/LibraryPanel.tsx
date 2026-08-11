import { PanelHint } from '@/features/app-shell/help/PanelHint';
import { CreatureKindFolder } from './folders/CreatureKindFolder';
import { CulturesFolder } from './folders/CulturesFolder';
import { ItemsFolder } from './folders/ItemsFolder';
import { NodeGroupsFolder } from './folders/NodeGroupsFolder';
import { PiecesFolder } from './folders/PiecesFolder';
import { TilesFolder } from './folders/TilesFolder';
import { WorldsFolder } from './folders/WorldsFolder';
import { useLibrarySelection } from './useLibrarySelection';

export function LibraryPanel() {
  const { clear } = useLibrarySelection();
  return (
    <div onKeyDown={(event) => event.key === 'Escape' && clear()}>
      <WorldsFolder />
      <TilesFolder />
      <ItemsFolder />
      <PiecesFolder />
      <CulturesFolder />
      <CreatureKindFolder folder="creatures" />
      <CreatureKindFolder folder="characters" />
      <NodeGroupsFolder />
      <PanelHint className="mt-2">
        Every kind of asset a world is made of, filed in folders — worlds included. Pick anything
        here and it opens in the detail column; pick it again, or press Esc, and the column closes.
        A world only appears in the game panel once you press ▶ run on it, so you can edit one world
        while another is on screen.
      </PanelHint>
    </div>
  );
}
