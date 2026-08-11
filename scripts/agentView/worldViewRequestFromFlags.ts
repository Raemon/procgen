import { FACING_NAMES, type FacingIndex } from '../../world/facing';
import {
  commandLineFlags,
  numberFlag,
  optionalNumberFlag,
  type CommandLineFlags,
} from './commandLineFlags';
import {
  DEFAULT_WORLD_NAME,
  type WorldViewRequest,
  type WorldViewStyle,
} from './worldViewRequest';

const DEFAULT_WIDTH = 960;
const DEFAULT_HEIGHT = 540;
const DEFAULT_OUTPUT_PATH = 'dist/agentView.png';

export interface WorldViewCommand {
  request: WorldViewRequest;
  outputPath: string;
}

export function worldViewCommandFromArgv(argv: readonly string[]): WorldViewCommand {
  const flags = commandLineFlags(argv);
  return {
    request: {
      worldName: flags.get('world') ?? DEFAULT_WORLD_NAME,
      x: numberFlag(flags, 'x', 0),
      y: numberFlag(flags, 'y', 0),
      facing: facingFromFlags(flags),
      style: styleFromFlags(flags),
      cameraDistanceTiles: optionalNumberFlag(flags, 'distance'),
      fieldOfViewDeg: optionalNumberFlag(flags, 'fov'),
      width: numberFlag(flags, 'width', DEFAULT_WIDTH),
      height: numberFlag(flags, 'height', DEFAULT_HEIGHT),
      showCeilings: flags.get('ceilings') === 'true',
      sightRadiusTiles: optionalNumberFlag(flags, 'sight'),
    },
    outputPath: flags.get('out') ?? DEFAULT_OUTPUT_PATH,
  };
}

function styleFromFlags(flags: CommandLineFlags): WorldViewStyle {
  const style = flags.get('view') ?? 'god';
  if (style !== 'god' && style !== 'character') throw new Error('--view must be god or character');
  return style;
}

function facingFromFlags(flags: CommandLineFlags): FacingIndex {
  const requested = flags.get('facing') ?? 'north';
  const named = FACING_NAMES.indexOf(requested as (typeof FACING_NAMES)[number]);
  if (named >= 0) return named as FacingIndex;
  return facingFromNumber(requested);
}

function facingFromNumber(requested: string): FacingIndex {
  const index = Number(requested);
  if (!Number.isInteger(index) || index < 0 || index > 7) {
    throw new Error(`--facing must be 0-7 or one of ${FACING_NAMES.join(', ')}`);
  }
  return index as FacingIndex;
}
