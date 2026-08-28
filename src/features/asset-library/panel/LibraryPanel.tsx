import { PanelHint } from '@/features/app-shell/help/PanelHint';
import { CreatureKindFolder } from './folders/CreatureKindFolder';
import { CulturesFolder } from './folders/CulturesFolder';
import { ItemsFolder } from './folders/ItemsFolder';
import { NodeGroupsFolder } from './folders/NodeGroupsFolder';
import { PiecesFolder } from './folders/PiecesFolder';
import { TilesFolder } from './folders/TilesFolder';
import { SavedWorldsFolder } from './folders/SavedWorldsFolder';
import { WorldSeedsFolder } from './folders/WorldSeedsFolder';
import { LibraryViewModeProvider, type LibraryViewMode } from './libraryViewMode';
import { useLibrarySelection } from './useLibrarySelection';

export function LibraryPanel({ viewMode }: { viewMode: LibraryViewMode }) {
  const { clear } = useLibrarySelection();
  return (
    <LibraryViewModeProvider mode={viewMode}>
      <div onKeyDown={(event) => event.key === 'Escape' && clear()}>
        <WorldSeedsFolder />
        <SavedWorldsFolder />
        <TilesFolder />
        <ItemsFolder />
        <PiecesFolder />
        <CulturesFolder />
        <CreatureKindFolder folder="creatures" />
        <CreatureKindFolder folder="characters" />
        <NodeGroupsFolder />
        <PanelHint className="mt-2">
          Every kind of asset a world is made of, filed in folders — world seeds and saved worlds
          included. Pick anything here and it opens in the detail column; pick it again, or press Esc,
          and the column closes. Nothing reaches the game panel until you press ▶ run on it, so you can
          edit one world seed while another world is on screen. ▶ on a seed grows a fresh world; ▶ on a
          save puts you back where you left off.
        </PanelHint>
      </div>
    </LibraryViewModeProvider>
  );
}
