import { registerNodeType } from '../../nodeRegistry';
import { fieldValue } from '../../values/chunkValues';

registerNodeType({
  type: 'constantField',
  title: 'constant field',
  category: 'examples',
  description: 'Fills every cell with one value. The smallest node — copy it to start your own.',
  inputs: {},
  params: {
    value: { kind: 'number', label: 'value', min: 0, max: 1, step: 0.01, default: 0.5 },
  },
  output: 'field',
  generateChunk: (ctx) => fieldValue(ctx.newField().fill(ctx.params.value as number)),
});
