import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import type { TileDef } from '../tileDef';
import type { EditableTileFields } from '../tileAssets';
import { MIN_BLOCKING_TILE_HEIGHT } from '../tileHeight';
import { Button } from '@/features/app-shell/controls/Button';
import { IconButton } from '@/features/app-shell/controls/IconButton';
import { classes } from '@/features/app-shell/controls/classes';
import { REVEALED_ON_ROW_HOVER, ROW_HOVER_GROUP } from '@/features/app-shell/controls/revealOnRowHover';
import { FIELD_CLASSES } from '@/features/app-shell/controls/fieldClasses';
import { dominantFaceColor } from '../dominantFaceColor';
import { unpaintedInk } from '../inkColor';
import { WalkIcon } from '@/features/app-shell/icons/panelIcons';
import { LightKnobRows } from '@/features/game/light/editor/LightKnobRows';
import { PixelArtEditor } from '../../pixelArtEditor/PixelArtEditor';
import { PERSISTED_UI_KEYS } from '@/features/app-shell/state/persistedUiKeys';
import { usePersistedUiSet } from '@/features/app-shell/state/usePersistedUiSet';
import { tooltipHandlers } from '@/features/app-shell/tooltips/tooltipHandlers';
import { deleteTileTip, TILE_HEIGHT_TIP, TILE_NAME_TIP, walkableTip } from './help/tileTips';
import { FaceArtToggle } from './FaceArtToggle';
import { ScaledArtStrip } from './ScaledArtStrip';
import { SymbolInput } from './SymbolInput';
import { TileShapeSelect } from './TileShapeSelect';

export function TileRow({ tile }: { tile: TileDef }) {
  const { perform } = useAppRuntime();
  const openTileArt = usePersistedUiSet(PERSISTED_UI_KEYS.openTileArt);
  const artOpen = openTileArt.has(String(tile.id));
  const editTile = (patch: EditableTileFields) => perform('update_tile', { tile_id: tile.id, ...patch });
  return (
    <div className="mb-1.5">
      <div className={classes(ROW_HOVER_GROUP, 'flex items-center gap-1.5')}>
        <FaceArtToggle tile={tile} open={artOpen} onToggle={() => openTileArt.toggle(String(tile.id))} />
        <SymbolInput symbol={tile.symbol} tint={tile.color} onPick={(symbol) => editTile({ symbol })} />
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
        <TileShapeSelect
          tile={tile}
          onPick={(shape) => perform('set_tile_shape', { tile_id: tile.id, shape })}
        />
      )}
      {artOpen && (
        <LightKnobRows
          emitter={tile}
          onChange={(patch) => perform('update_tile', { tile_id: tile.id, ...patch })}
        />
      )}
      {artOpen && tile.faceArt && (
        <ScaledArtStrip pixels={tile.faceArt.top} unpainted={unpaintedInk(tile.color)} />
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
      min={MIN_BLOCKING_TILE_HEIGHT}
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
