import { insertCommands } from './insert/insertCommands';
import { movementCommands } from './input/movementCommands';
import { pickupCommands } from './items/pickupCommands';
import { puzzleCommands } from './puzzles/puzzleCommands';
import { sightCommands } from './vision/sightCommands';

export const gameCommands = [
  ...captureCommands,
  ...insertCommands,
  ...movementCommands,
  ...pickupCommands,
  ...puzzleCommands,
  ...sightCommands,
];
import { captureCommands } from './capture/captureCommands';
