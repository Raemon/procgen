import { Button } from '../../../frontend/controls/Button';
import type { PieceEditor } from './usePieceEditor';
import { LAYER_TIPS } from './help/pieceTips';

const STEP_CLASSES = 'px-2 py-0.5 text-[11px]';

export function LayerStepper({ editor }: { editor: PieceEditor }) {
  const { piece, layer } = editor;
  return (
    <div className="flex items-center gap-1.5">
      <Button
        className={STEP_CLASSES}
        tip={LAYER_TIPS.lower}
        disabled={layer === 0}
        onClick={() => editor.selectLayer(layer - 1)}
      >
        ▾
      </Button>
      <span className="min-w-[68px] text-center text-[11px] text-ink-dim">
        layer {layer + 1}/{piece.layers}
      </span>
      <Button
        className={STEP_CLASSES}
        tip={LAYER_TIPS.higher}
        disabled={layer === piece.layers - 1}
        onClick={() => editor.selectLayer(layer + 1)}
      >
        ▴
      </Button>
      <Button className={STEP_CLASSES} tip={LAYER_TIPS.add} onClick={editor.addLayer}>
        +
      </Button>
      <Button
        className={STEP_CLASSES}
        tip={LAYER_TIPS.remove}
        disabled={piece.layers === 1}
        onClick={editor.removeLayer}
      >
        −
      </Button>
    </div>
  );
}
