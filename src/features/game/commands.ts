import { insertCommands } from './insert/insertCommands';
import { movementCommands } from './input/movementCommands';
import { pickupCommands } from './items/pickupCommands';
import { puzzleCommands } from './puzzles/puzzleCommands';
import { visionCommands } from './vision/visionCommands';

export const gameCommands = [
  ...captureCommands,
  ...insertCommands,
  ...movementCommands,
  ...pickupCommands,
  ...puzzleCommands,
  ...visionCommands,
];
import { captureCommands } from './capture/captureCommands';
