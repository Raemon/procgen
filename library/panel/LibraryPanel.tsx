import { PanelHint } from '../../frontend/help/PanelHint';
import { WorldIcon } from '../../frontend/icons/panelIcons';
import { CreatureKindFolder } from '../folders/CreatureKindFolder';
import { CulturesFolder } from '../folders/CulturesFolder';
import { ItemsFolder } from '../folders/ItemsFolder';
import { NodeGroupsFolder } from '../folders/NodeGroupsFolder';
import { PiecesFolder } from '../folders/PiecesFolder';
import { PipelineFolder } from '../folders/PipelineFolder';
import { TilesFolder } from '../folders/TilesFolder';
import { WORLD_ROW_TIP } from '../help/libraryTips';
import { LibraryRow } from './LibraryRow';

export function LibraryPanel() {
  return (
    <>
      <LibraryRow
        folder="world"
        entryKey=""
        name="world"
        glyph={<WorldIcon size={13} />}
        tip={WORLD_ROW_TIP}
      />
      <TilesFolder />
      <ItemsFolder />
      <PiecesFolder />
      <CulturesFolder />
      <CreatureKindFolder folder="creatures" />
      <CreatureKindFolder folder="characters" />
      <NodeGroupsFolder />
      <PipelineFolder />
      <PanelHint className="mt-2">
        Everything a world is made of, filed in folders. Pick anything here and it opens in the
        detail column: a tile to paint, a piece to carve, a node to tune. Node groups are
        bookmarked runs of nodes that work together — stamp one into the pipeline, or save a
        pipeline folder band back out as a group of your own.
      </PanelHint>
    </>
  );
}
