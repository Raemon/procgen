export const CHARACTER_EYE_HEIGHT = 1.1;
export const CHARACTER_FIELD_OF_VIEW_AT_UNIT_ZOOM_DEG = 70;
export const CHARACTER_DOWNWARD_PITCH_DEG = 12;

export function distanceWhereHeightEntersView(height: number): number {
  const aboveEye = height - CHARACTER_EYE_HEIGHT;
  if (aboveEye <= 0) return 0;
  return aboveEye / Math.tan(topEdgeOfViewRadians());
}

function topEdgeOfViewRadians(): number {
  return radiansOf(CHARACTER_FIELD_OF_VIEW_AT_UNIT_ZOOM_DEG / 2 - CHARACTER_DOWNWARD_PITCH_DEG);
}

function radiansOf(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
