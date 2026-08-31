import { useState } from 'react';
import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import { Button } from '@/features/app-shell/controls/Button';
import { ConfirmModal } from '@/features/app-shell/controls/ConfirmModal';
import { IconButton } from '@/features/app-shell/controls/IconButton';
import { KnobRow } from '@/features/app-shell/controls/KnobRow';
import { Slider } from '@/features/app-shell/controls/Slider';
import { ValueReadout } from '@/features/app-shell/controls/ValueReadout';
import { classes } from '@/features/app-shell/controls/classes';
import { FIELD_CLASSES } from '@/features/app-shell/controls/fieldClasses';
import { WalkIcon } from '@/features/app-shell/icons/panelIcons';
import { PERSISTED_UI_KEYS } from '@/features/app-shell/state/persistedUiKeys';
import { usePersistedUiSet } from '@/features/app-shell/state/usePersistedUiSet';
import { tooltipHandlers } from '@/features/app-shell/tooltips/tooltipHandlers';
import { LightKnobRows } from '@/features/game/light/editor/LightKnobRows';
import { deleteRowConfirmation } from '@/features/asset-library/help/rowActionTips';
import { useLibrarySelection } from '@/features/asset-library/panel/useLibrarySelection';
import { PixelArtEditor } from '../../pixelArtEditor/PixelArtEditor';
import { dominantFaceColor } from '../dominantFaceColor';
import { unpaintedInk } from '../inkColor';
import type { EditableTileFields } from '../tileAssets';
import type { TileDef } from '../tileDef';
import { FaceArtToggle } from './FaceArtToggle';
import { ScaledArtStrip } from './ScaledArtStrip';
import { SymbolInput } from './SymbolInput';
import { TileShapeSelect } from './TileShapeSelect';
import {
  deleteTileTip,
  duplicateTileTip,
  TILE_HEIGHT_TIP,
  TILE_NAME_TIP,
  TILE_SHAPE_TIP,
  walkableTip,
} from './help/tileTips';

export function TileSheet({ tile }: { tile: TileDef }) {
  const { perform } = useAppRuntime();
  const openTileArt = usePersistedUiSet(PERSISTED_UI_KEYS.openTileArt);
  const artOpen = openTileArt.has(String(tile.id));
  const editTile = (patch: EditableTileFields) =>
    perform('update_tile', { tile_id: tile.id, ...patch });
  return (
    <div className="mb-1.5">
      <div className="mb-2 flex items-center gap-1.5">
        <FaceArtToggle
          tile={tile}
          open={artOpen}
          onToggle={() => openTileArt.toggle(String(tile.id))}
        />
        <SymbolInput symbol={tile.symbol} tint={tile.color} onPick={(symbol) => editTile({ symbol })} />
        <input
          type="text"
          className={classes(FIELD_CLASSES, 'min-w-0 flex-1')}
          aria-label="tile name"
          value={tile.name}
          onChange={(event) => editTile({ name: event.target.value })}
          {...tooltipHandlers(TILE_NAME_TIP)}
        />
      </div>
      <TileActionsRow tile={tile} />
      <KnobRow label="walkable" tip={walkableTip(tile)}>
        <IconButton
          tip={walkableTip(tile)}
          active={tile.walkable}
          onClick={() => editTile({ walkable: !tile.walkable })}
        >
          <WalkIcon />
        </IconButton>
      </KnobRow>
      {!tile.walkable && (
        <KnobRow label="height" tip={TILE_HEIGHT_TIP}>
          <Slider
            min={0.5}
            max={8}
            step={0.5}
            value={tile.height}
            onChange={(height) => editTile({ height })}
          />
          <ValueReadout value={tile.height} />
        </KnobRow>
      )}
      <KnobRow label="shape" tip={TILE_SHAPE_TIP}>
        <TileShapeSelect
          tile={tile}
          onPick={(shape) => perform('set_tile_shape', { tile_id: tile.id, shape })}
        />
      </KnobRow>
      <LightKnobRows
        emitter={tile}
        onChange={(patch) => perform('update_tile', { tile_id: tile.id, ...patch })}
      />
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

function TileActionsRow({ tile }: { tile: TileDef }) {
  const { perform } = useAppRuntime();
  const { clear } = useLibrarySelection();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function deleteThisTile(): void {
    setConfirmingDelete(false);
    perform('remove_tile', { tile_id: tile.id });
    clear();
  }

  return (
    <>
      <div className="mb-2 flex gap-1.5">
        <Button
          className="flex-1"
          tip={duplicateTileTip(tile)}
          onClick={() => perform('duplicate_tile', { tile_id: tile.id })}
        >
          ⧉ duplicate
        </Button>
        <Button
          className="hover:border-danger-edge hover:text-danger-ink"
          tip={deleteTileTip(tile)}
          onClick={() => setConfirmingDelete(true)}
        >
          ✕
        </Button>
      </div>
      {confirmingDelete && (
        <ConfirmModal
          {...deleteRowConfirmation(tile.name)}
          onConfirm={deleteThisTile}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </>
  );
}
