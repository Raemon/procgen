import { MAX_PIECE_LAYERS, MAX_PIECE_SIDE, type Piece } from '../pieceDef';
import { classes } from '@/features/app-shell/controls/classes';
import { FIELD_CLASSES } from '@/features/app-shell/controls/fieldClasses';
import type { TooltipContent } from '@/features/app-shell/tooltips/tooltipContent';
import { tooltipHandlers } from '@/features/app-shell/tooltips/tooltipHandlers';
import { SIZE_TIPS } from './help/pieceTips';
import type { PieceEditor } from './usePieceEditor';

export function PieceSizeRow({ editor }: { editor: PieceEditor }) {
  const { piece } = editor;
  return (
    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-ink-dim">
      <span>size</span>
      <SizeField
        tip={SIZE_TIPS.width}
        value={piece.width}
        max={MAX_PIECE_SIDE}
        onChange={(width) => editor.resize(extentWith(piece, { width }))}
      />
      <span>×</span>
      <SizeField
        tip={SIZE_TIPS.depth}
        value={piece.depth}
        max={MAX_PIECE_SIDE}
        onChange={(depth) => editor.resize(extentWith(piece, { depth }))}
      />
      <span>×</span>
      <SizeField
        tip={SIZE_TIPS.layers}
        value={piece.layers}
        max={MAX_PIECE_LAYERS}
        onChange={(layers) => editor.resize(extentWith(piece, { layers }))}
      />
    </div>
  );
}

function extentWith(piece: Piece, patch: Partial<{ width: number; depth: number; layers: number }>) {
  return { width: piece.width, depth: piece.depth, layers: piece.layers, ...patch };
}

function SizeField({
  tip,
  value,
  max,
  onChange,
}: {
  tip: TooltipContent;
  value: number;
  max: number;
  onChange(value: number): void;
}) {
  return (
    <input
      type="number"
      min={1}
      max={max}
      aria-label={tip.title}
      className={classes(FIELD_CLASSES, 'w-12')}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      {...tooltipHandlers(tip)}
    />
  );
}
