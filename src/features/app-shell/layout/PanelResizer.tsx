import { useRef, type PointerEvent } from 'react';
import { tooltipHandlers } from '@/features/app-shell/tooltips/tooltipHandlers';
import { RESIZER_TIP } from '../help/panelTips';

interface DragOrigin {
  pointerX: number;
  width: number;
}

export function PanelResizer({
  width,
  disabled,
  onResize,
  onResetWidth,
}: {
  width: number;
  disabled?: boolean;
  onResize(width: number): void;
  onResetWidth(): void;
}) {
  const origin = useRef<DragOrigin | null>(null);
  if (disabled) return <div className="bg-panel-edge" />;
  return (
    <div
      className="relative bg-panel-edge transition-colors hover:bg-accent"
      onPointerDown={(event) => (origin.current = beginDrag(event, width))}
      onPointerMove={(event) => resizeWhileDragging(event, origin.current, onResize)}
      onPointerUp={() => (origin.current = null)}
      onPointerCancel={() => (origin.current = null)}
      onDoubleClick={onResetWidth}
      {...tooltipHandlers(RESIZER_TIP)}
    >
      <span className="absolute inset-y-0 -right-[3px] -left-[3px] z-20 cursor-col-resize" />
    </div>
  );
}

function beginDrag(event: PointerEvent<HTMLElement>, width: number): DragOrigin {
  event.preventDefault();
  event.currentTarget.setPointerCapture(event.pointerId);
  return { pointerX: event.clientX, width };
}

function resizeWhileDragging(
  event: PointerEvent<HTMLElement>,
  origin: DragOrigin | null,
  onResize: (width: number) => void,
): void {
  if (origin) onResize(origin.width + event.clientX - origin.pointerX);
}
