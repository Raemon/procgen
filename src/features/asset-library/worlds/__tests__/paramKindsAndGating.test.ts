import '../nodes';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { mulberry32 } from '../random/mulberry32';
import { randomParams } from '../randomize/randomNodeParams';
import { BORN } from '../values/pointData';
import {
  defaultParams,
  isKnobParamSpec,
  paramIsVisible,
  type StandardNodeTypeDef,
} from '../nodeType';
import { fieldValue } from '../values/chunkValues';

const DATE_READER: StandardNodeTypeDef = {
  type: 'unregisteredDateReader',
  title: 'date reader',
  category: 'time',
  description: 'A fixture, never registered, standing in for a node that reads one attribute of its points.',
  whenToUse: 'Only here, to prove the param kinds work before a real node needs them.',
  inputs: { source: { kind: 'points', label: 'source', help: 'The points to read.' } },
  params: {
    attribute: {
      kind: 'pointKey',
      label: 'attribute',
      help: 'Which of the attributes the wired points carry to read.',
      from: 'source',
      default: BORN,
    },
    mode: { kind: 'toggle', label: 'mode', help: 'Which way to read it.', default: 0 },
    depth: {
      kind: 'int',
      label: 'depth',
      help: 'Only meaningful in the second mode.',
      min: 0,
      max: 8,
      default: 2,
      visibleWhen: { param: 'mode', equals: 1 },
    },
  },
  output: 'field',
  generateChunk: (ctx) => fieldValue(ctx.newField()),
};

export function checkParamKindsAndGating(check: CheckReporter): void {
  check(
    'a point-attribute knob is a knob, so the registry would accept a node declaring one',
    Object.values(DATE_READER.params).every(isKnobParamSpec),
  );
  check(
    'a point-attribute knob defaults to the attribute name it names, not to a number',
    defaultParams(DATE_READER).attribute === BORN,
  );
  check(
    'rolling random params leaves a point-attribute knob a name rather than rolling a number into it',
    randomParams(DATE_READER, mulberry32(7), []).attribute === BORN,
  );
  const params = defaultParams(DATE_READER);
  check(
    'a knob gated on another knob stays hidden while that knob disagrees',
    !paramIsVisible(DATE_READER.params.depth!, params) &&
      paramIsVisible(DATE_READER.params.mode!, params),
  );
  check(
    'the same knob appears once the knob it is gated on matches',
    paramIsVisible(DATE_READER.params.depth!, { ...params, mode: 1 }),
  );
  check(
    'an ungated knob is visible whatever the rest of the node says',
    paramIsVisible(DATE_READER.params.attribute!, { ...params, mode: 1 }),
  );
}
