import { registerNodeType } from '../../nodeRegistry';
import { fieldValue } from '../../values/chunkValues';

registerNodeType({
  type: 'constantField',
  title: 'constant field',
  category: 'basics',
  description: 'Fills every cell with one value. The smallest node — copy it to start your own.',
  whenToUse:
    'A flat baseline: combine it with noise to bias terrain up or down, or use it as a stand-in input while debugging a pipeline.',
  inputs: {},
  params: {
    value: {
      kind: 'number',
      label: 'value',
      help: 'The value every cell gets, from 0 (lowest) to 1 (highest).',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.5,
    },
  },
  output: 'field',
  outputSemantic: 'unit',
  generateChunk: (ctx) => fieldValue(ctx.newField().fill(ctx.params.value as number)),
});
