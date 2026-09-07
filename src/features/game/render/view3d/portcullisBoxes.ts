export interface PortcullisBox {
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  depth: number;
}

export const GATE_HEIGHT = 2;
export const GRILLE_HEIGHT = GATE_HEIGHT;
export const GRILLE_TRAVEL = GRILLE_HEIGHT;

const BAR_OFFSETS = [-0.375, -0.125, 0.125, 0.375];
const BAR_WIDTH = 0.09;
const PANEL_DEPTH = 0.2;
const RAIL_WIDTH = 0.92;
const RAIL_HEIGHT = 0.24;

export function portcullisGrilleBoxes(height: number = GATE_HEIGHT): PortcullisBox[] {
  return [...verticalBars(height), footRail()];
}

function verticalBars(height: number): PortcullisBox[] {
  const standing = Math.max(0, height - RAIL_HEIGHT);
  return BAR_OFFSETS.map((offset) => ({
    x: offset,
    y: RAIL_HEIGHT + standing / 2,
    z: 0,
    width: BAR_WIDTH,
    height: standing,
    depth: PANEL_DEPTH,
  }));
}

function footRail(): PortcullisBox {
  return { x: 0, y: RAIL_HEIGHT / 2, z: 0, width: RAIL_WIDTH, height: RAIL_HEIGHT, depth: PANEL_DEPTH };
}
