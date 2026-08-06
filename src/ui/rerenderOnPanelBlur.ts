export function rerenderOnPanelBlur(panels: readonly HTMLElement[], rerender: () => void): void {
  for (const panel of panels) panel.addEventListener('focusout', () => rerender());
}
