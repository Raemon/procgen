import { PanelHint } from '../../frontend/help/PanelHint';
import { CreatureKindFolder } from '../folders/CreatureKindFolder';
import { CulturesFolder } from '../folders/CulturesFolder';
import { ItemsFolder } from '../folders/ItemsFolder';
import { NodeGroupsFolder } from '../folders/NodeGroupsFolder';
import { PiecesFolder } from '../folders/PiecesFolder';
import { TilesFolder } from '../folders/TilesFolder';
import { WorldsFolder } from '../folders/WorldsFolder';

export function LibraryPanel() {
  return (
    <>
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
        here and it opens in the detail column: a world to wire, a tile to paint, a piece to carve.
        Node groups are bookmarked runs of nodes that work together — stamp one into the world you
        are editing, or send a folder band from that world back here.
      </PanelHint>
    </>
  );
}
