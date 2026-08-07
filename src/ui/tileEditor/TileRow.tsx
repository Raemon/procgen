import { useAppRuntime } from '../../app/appRuntimeContext';
import type { TileDef } from '../../world/tiles/tileDef';
import type { EditableTileFields } from '../../world/tiles/tileset';
import { Button } from '../controls/Button';
import { IconButton } from '../controls/IconButton';
import { classes } from '../controls/classes';
import { REVEALED_ON_ROW_HOVER, ROW_HOVER_GROUP } from '../controls/revealOnRowHover';
import { FIELD_CLASSES } from '../controls/fieldClasses';
import { dominantFaceColor } from '../../world/tiles/dominantFaceColor';
import { WalkIcon } from '../icons/panelIcons';
import { PixelArtEditor } from '../pixelArtEditor/PixelArtEditor';
import { PERSISTED_UI_KEYS } from '../uiState/persistedUiKeys';
import { usePersistedUiSet } from '../uiState/usePersistedUiSet';
import { FaceArtToggle } from './FaceArtToggle';
import { SymbolInput } from './SymbolInput';

export function TileRow({ tile }: { tile: TileDef }) {
  const { perform } = useAppRuntime();
  const openTileArt = usePersistedUiSet(PERSISTED_UI_KEYS.openTileArt);
  const artOpen = openTileArt.has(String(tile.id));
  const editTile = (patch: EditableTileFields) => perform('update_tile', { tile_id: tile.id, ...patch });
  return (
    <div className="mb-1.5">
      <div className={classes(ROW_HOVER_GROUP, 'flex items-center gap-1.5')}>
        <FaceArtToggle tile={tile} open={artOpen} onToggle={() => openTileArt.toggle(String(tile.id))} />
        <SymbolInput symbol={tile.symbol} onPick={(symbol) => editTile({ symbol })} />
        <input
          type="text"
          className={classes(FIELD_CLASSES, 'min-w-0 flex-1')}
          title="name"
          value={tile.name}
          onChange={(event) => editTile({ name: event.target.value })}
        />
        <WalkableToggle tile={tile} onToggle={(walkable) => editTile({ walkable })} />
        <Button
          className={classes(
            REVEALED_ON_ROW_HOVER,
            'px-2 py-0.5 hover:border-danger-edge hover:text-danger-ink',
          )}
          title="delete tile"
          onClick={() => perform('remove_tile', { tile_id: tile.id })}
        >
          ×
        </Button>
      </div>
      {artOpen && (
        <PixelArtEditor
          art={tile.faceArt}
          baseColor={tile.color}
          onChange={(faceArt) =>
            editTile({ faceArt, color: dominantFaceColor(faceArt) ?? tile.color })
          }
        />
      )}
    </div>
  );
}

function WalkableToggle({ tile, onToggle }: { tile: TileDef; onToggle(walkable: boolean): void }) {
  return (
    <IconButton
      title={tile.walkable ? 'walkable — click to block' : 'blocks movement — click to allow walking'}
      active={tile.walkable}
      onClick={() => onToggle(!tile.walkable)}
    >
      <WalkIcon />
    </IconButton>
  );
}
