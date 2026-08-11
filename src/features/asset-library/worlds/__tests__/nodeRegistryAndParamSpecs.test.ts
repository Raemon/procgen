import '../nodes';
import { allNodeTypes } from '../nodeRegistry';
import { defaultParams, isKnobParamSpec, outputKindOf } from '../nodeType';
import { sanitizePipeline } from '../pipeline/sanitizePipeline';
import { examplePipelines } from '../presets/examplePipelines';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';

export function checkNodeRegistryAndParamSpecs(check: CheckReporter): void {
  check('node registry has example, maze, river and custom nodes', allNodeTypes().length >= 9);
  check(
    'every node type except custom script is built only from numeric knobs and tile links',
    allNodeTypes().every(
      (def) => def.type === 'customScript' || Object.values(def.params).every(isKnobParamSpec),
    ),
  );
  check(
    'every choice knob stores numbers and explains every option',
    allNodeTypes().every((def) =>
      Object.values(def.params).every(
        (spec) =>
          spec.kind !== 'choice' ||
          spec.options.every(
            (option) =>
              typeof option.value === 'number' && option.label.length > 0 && option.help.length > 0,
          ),
      ),
    ),
  );
  check(
    'every node type explains what it does and when to use it',
    allNodeTypes().every((def) => def.description.length > 0 && def.whenToUse.length > 0),
  );
  check(
    'every param and input carries help text for its tooltip',
    allNodeTypes().every(
      (def) =>
        Object.values(def.params).every((spec) => spec.help.length > 0) &&
        Object.values(def.inputs).every((spec) => spec.help.length > 0),
    ),
  );
  check(
    'every select param explains each of its options',
    allNodeTypes().every((def) =>
      Object.values(def.params).every(
        (spec) => spec.kind !== 'select' || spec.options.every((option) => (spec.optionHelp[option] ?? '').length > 0),
      ),
    ),
  );
  check(
    'every example pipeline describes itself and comments every node',
    examplePipelines().every(
      (example) =>
        example.description.length > 0 &&
        sanitizePipeline(example.state).nodes.every((node) => node.comment.length > 0),
    ),
  );
  check(
    'every node type declares a resolvable output kind',
    allNodeTypes().every((def) =>
      ['field', 'tiles', 'points'].includes(outputKindOf(def, defaultParams(def))),
    ),
  );
}
