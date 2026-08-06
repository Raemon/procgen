const PRIMARY_BUTTON = 0;

export function listenForDragPan(
  target: HTMLElement,
  onDragPixels: (dxPixels: number, dyPixels: number) => void,
): void {
  let draggingPointerId: number | null = null;
  let lastX = 0;
  let lastY = 0;

  target.addEventListener('pointerdown', (event) => {
    if (event.button !== PRIMARY_BUTTON) return;
    draggingPointerId = event.pointerId;
    lastX = event.clientX;
    lastY = event.clientY;
    target.setPointerCapture(event.pointerId);
    target.style.cursor = 'grabbing';
  });

  target.addEventListener('pointermove', (event) => {
    if (event.pointerId !== draggingPointerId) return;
    onDragPixels(event.clientX - lastX, event.clientY - lastY);
    lastX = event.clientX;
    lastY = event.clientY;
  });

  const endDrag = (event: PointerEvent): void => {
    if (event.pointerId !== draggingPointerId) return;
    draggingPointerId = null;
    target.style.cursor = '';
  };
  target.addEventListener('pointerup', endDrag);
  target.addEventListener('pointercancel', endDrag);
}
