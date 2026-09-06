import { captureCommands } from './capture/captureCommands';
import { fixtureCommands } from './fixtures/fixtureCommands';
import { insertCommands } from './insert/insertCommands';
import { movementCommands } from './input/movementCommands';
import { pickupCommands } from './items/pickupCommands';
import { visionCommands } from './vision/visionCommands';

export const gameCommands = [
  ...captureCommands,
  ...fixtureCommands,
  ...insertCommands,
  ...movementCommands,
  ...pickupCommands,
  ...visionCommands,
];
