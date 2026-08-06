import { useRef, type PointerEvent } from 'react';

interface DragOrigin {
  pointerX: number;
  width: number;
}

export function PanelResizer({
  width,
  onResize,
}: {
  width: number;
  onResize(width: number): void;
}) {
  const origin = useRef<DragOrigin | null>(null);
  return (
    <div
      className="cursor-col-resize bg-panel-edge transition-colors hover:bg-accent"
      onPointerDown={(event) => (origin.current = beginDrag(event, width))}
      onPointerMove={(event) => resizeWhileDragging(event, origin.current, onResize)}
      onPointerUp={() => (origin.current = null)}
      onPointerCancel={() => (origin.current = null)}
    />
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
