import { cellWithin, circuitTouches, type Circuit } from '../circuits/circuit';
import type { CratePush, PuzzleCue, PuzzleCues, PuzzleSource } from '../circuits/puzzleCues';
import type { Cell } from '../worldRules';

export interface CueScene {
  crates: Cell[];
  circuit: Circuit;
  source: PuzzleSource;
}

export function sceneWithOneCrate(): CueScene {
  const scene: CueScene = {
    crates: [{ x: 3, y: 3 }],
    circuit: {
      key: 'room',
      plates: [{ x: 5, y: 5, lit: false }],
      doors: [{ x: 8, y: 5, open: false }],
      wires: [],
      powered: false,
    },
    source: {
      circuitsIn: (minX, minY, maxX, maxY) =>
        [structuredClone(scene.circuit)].filter((circuit) => circuitTouches(circuit, minX, minY, maxX, maxY)),
      cratesIn: (minX, minY, maxX, maxY) => scene.crates.filter((cell) => cellWithin(cell, minX, minY, maxX, maxY)),
    },
  };
  return scene;
}

export interface HeardCues {
  cells: Map<PuzzleCue, Cell[][]>;
  pushes: CratePush[][];
  clear(): void;
}

export function listenTo(cues: PuzzleCues): HeardCues {
  const cells = new Map<PuzzleCue, Cell[][]>();
  const pushes: CratePush[][] = [];
  const record = (cue: PuzzleCue, at: Cell[]) => cells.set(cue, [...(cells.get(cue) ?? []), at]);
  cues.on('crate-pushed', (moved) => {
    pushes.push(moved);
    record('crate-pushed', moved.map((push) => push.to));
  });
  for (const cue of ['plate-lit', 'door-opened', 'circuit-powered'] as const) cues.on(cue, (at) => record(cue, at));
  return {
    cells,
    pushes,
    clear: () => {
      cells.clear();
      pushes.length = 0;
    },
  };
}
