import { HINT_CLASSES } from '../../../frontend/controls/fieldClasses';

export function NothingSelected() {
  return (
    <p className={HINT_CLASSES}>
      Nothing is selected. Pick anything in the asset library and it opens here — a world to wire, a
      tile to paint, a node group to rework. Clicking it again, or pressing Esc, closes it.
    </p>
  );
}
