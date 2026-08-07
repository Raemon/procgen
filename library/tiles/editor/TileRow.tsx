import { useAppRuntime } from '../../../frontend/appRuntimeContext';
import type { TileDef } from '../tileDef';
import type { EditableTileFields } from '../tileset';
import { Button } from '../../../frontend/controls/Button';
import { IconButton } from '../../../frontend/controls/IconButton';
import { classes } from '../../../frontend/controls/classes';
import { REVEALED_ON_ROW_HOVER, ROW_HOVER_GROUP } from '../../../frontend/controls/revealOnRowHover';
import { FIELD_CLASSES } from '../../../frontend/controls/fieldClasses';
import { dominantFaceColor } from '../dominantFaceColor';
import { WalkIcon } from '../../../frontend/icons/panelIcons';
import { LightKnobRows } from '../../../world/light/editor/LightKnobRows';
import { PixelArtEditor } from '../../pixelArtEditor/PixelArtEditor';
import { PERSISTED_UI_KEYS } from '../../../frontend/uiState/persistedUiKeys';
import { usePersistedUiSet } from '../../../frontend/uiState/usePersistedUiSet';
import { tooltipHandlers } from '../../../frontend/tooltips/tooltipHandlers';
import { deleteTileTip, TILE_HEIGHT_TIP, TILE_NAME_TIP, walkableTip } from './help/tileTips';
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
          aria-label="tile name"
          value={tile.name}
          onChange={(event) => editTile({ name: event.target.value })}
          {...tooltipHandlers(TILE_NAME_TIP)}
        />
        {!tile.walkable && (
          <HeightInput height={tile.height} onChange={(height) => editTile({ height })} />
        )}
        <WalkableToggle tile={tile} onToggle={(walkable) => editTile({ walkable })} />
        <Button
          className={classes(
            REVEALED_ON_ROW_HOVER,
            'px-2 py-0.5 hover:border-danger-edge hover:text-danger-ink',
          )}
          tip={deleteTileTip(tile)}
          onClick={() => perform('remove_tile', { tile_id: tile.id })}
        >
          ×
        </Button>
      </div>
      {artOpen && (
        <LightKnobRows
          emitter={tile}
          onChange={(patch) => perform('update_tile', { tile_id: tile.id, ...patch })}
        />
      )}
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

function HeightInput({ height, onChange }: { height: number; onChange(height: number): void }) {
  return (
    <input
      type="number"
      min={0.5}
      max={8}
      step={0.5}
      className={classes(FIELD_CLASSES, 'w-14 shrink-0')}
      aria-label="tile height"
      value={height}
      onChange={(event) => onChange(heightFromField(event.target.value, height))}
      {...tooltipHandlers(TILE_HEIGHT_TIP)}
    />
  );
}

function heightFromField(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function WalkableToggle({ tile, onToggle }: { tile: TileDef; onToggle(walkable: boolean): void }) {
  return (
    <IconButton
      tip={walkableTip(tile)}
      active={tile.walkable}
      onClick={() => onToggle(!tile.walkable)}
    >
      <WalkIcon />
    </IconButton>
  );
}
