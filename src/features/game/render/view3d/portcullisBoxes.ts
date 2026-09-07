export interface PortcullisBox {
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  depth: number;
}

export const GATE_HEIGHT = 2;
export const LINTEL_HEIGHT = 0.26;
export const GRILLE_HEIGHT = GATE_HEIGHT - LINTEL_HEIGHT;
export const GRILLE_TRAVEL = GRILLE_HEIGHT;

const JAMB_WIDTH = 0.15;
const JAMB_DEPTH = 0.38;
const OPENING_WIDTH = 1 - 2 * JAMB_WIDTH;
const BAR_COUNT = 5;
const BAR_WIDTH = 0.075;
const BAR_DEPTH = 0.1;
const RAIL_HEIGHT = 0.075;
const RAIL_DEPTH = 0.14;
const RAIL_HEIGHTS = [0.24, 0.94, 1.6];

export function portcullisFrameBoxes(): PortcullisBox[] {
  const jambCenter = 0.5 - JAMB_WIDTH / 2;
  return [
    jamb(-jambCenter),
    jamb(jambCenter),
    { x: 0, y: GATE_HEIGHT - LINTEL_HEIGHT / 2, z: 0, width: 1, height: LINTEL_HEIGHT, depth: JAMB_DEPTH },
  ];
}

export function portcullisGrilleBoxes(): PortcullisBox[] {
  return [...verticalBars(), ...horizontalRails()];
}

function jamb(x: number): PortcullisBox {
  return { x, y: GATE_HEIGHT / 2, z: 0, width: JAMB_WIDTH, height: GATE_HEIGHT, depth: JAMB_DEPTH };
}

function verticalBars(): PortcullisBox[] {
  const spacing = OPENING_WIDTH / BAR_COUNT;
  return Array.from({ length: BAR_COUNT }, (_unused, bar) => ({
    x: -OPENING_WIDTH / 2 + spacing * (bar + 0.5),
    y: GRILLE_HEIGHT / 2,
    z: 0,
    width: BAR_WIDTH,
    height: GRILLE_HEIGHT,
    depth: BAR_DEPTH,
  }));
}

function horizontalRails(): PortcullisBox[] {
  return RAIL_HEIGHTS.map((y) => ({
    x: 0,
    y,
    z: 0,
    width: OPENING_WIDTH,
    height: RAIL_HEIGHT,
    depth: RAIL_DEPTH,
  }));
}
