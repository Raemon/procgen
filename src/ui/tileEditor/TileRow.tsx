import { useState } from 'react';
import { useAppRuntime } from '../../app/appRuntimeContext';
import type { TileDef } from '../../world/tiles/tileDef';
import type { EditableTileFields } from '../../world/tiles/tileset';
import { Button } from '../controls/Button';
import { classes } from '../controls/classes';
import { COLOR_INPUT_CLASSES, FIELD_CLASSES } from '../controls/fieldClasses';
import { PixelArtEditor } from '../pixelArtEditor/PixelArtEditor';
import { FaceArtToggle } from './FaceArtToggle';
import { SymbolInput } from './SymbolInput';

export function TileRow({ tile }: { tile: TileDef }) {
  const { perform } = useAppRuntime();
  const [artOpen, setArtOpen] = useState(false);
  const editTile = (patch: EditableTileFields) => perform('update_tile', { tile_id: tile.id, ...patch });
  return (
    <div className="mb-1.5">
      <div className="flex items-center gap-1.5">
        <input
          type="color"
          className={COLOR_INPUT_CLASSES}
          title="color"
          value={tile.color}
          onChange={(event) => editTile({ color: event.target.value })}
        />
        <SymbolInput symbol={tile.symbol} onPick={(symbol) => editTile({ symbol })} />
        <input
          type="text"
          className={classes(FIELD_CLASSES, 'min-w-0 flex-1')}
          title="name"
          value={tile.name}
          onChange={(event) => editTile({ name: event.target.value })}
        />
        <WalkableToggle tile={tile} onToggle={(walkable) => editTile({ walkable })} />
        <FaceArtToggle tile={tile} open={artOpen} onToggle={() => setArtOpen(!artOpen)} />
        <Button
          className="px-2 py-0.5 hover:border-danger-edge hover:text-danger-ink"
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
          onChange={(faceArt) => editTile({ faceArt })}
        />
      )}
    </div>
  );
}

function WalkableToggle({ tile, onToggle }: { tile: TileDef; onToggle(walkable: boolean): void }) {
  return (
    <label
      className="flex items-center gap-[3px] text-[11px] whitespace-nowrap text-ink-dim"
      title="walkable"
    >
      <input
        type="checkbox"
        className="accent-accent"
        checked={tile.walkable}
        onChange={(event) => onToggle(event.target.checked)}
      />
      walk
    </label>
  );
}
