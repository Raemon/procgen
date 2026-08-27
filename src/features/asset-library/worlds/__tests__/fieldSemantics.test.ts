import '../nodes';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { allNodeTypes, nodeTypeOf } from '../nodeRegistry';
import { defaultParams, outputKindOf, outputSemanticOf, type InputSpec } from '../nodeType';
import { createNodeInstance } from '../pipeline/createNodeInstance';
import type { NodeInstance } from '../pipeline/pipelineState';
import { isWireValid, wiringMismatch } from '../pipeline/wiringRules';
import { emptyPipeline } from '../pipeline/pipelineState';

function instanceOf(type: string, id: string): NodeInstance {
  return createNodeInstance(nodeTypeOf(type)!, id);
}

function inputSpec(type: string, input: string): InputSpec {
  return nodeTypeOf(type)!.inputs[input]!;
}

export function checkFieldSemantics(check: CheckReporter): void {
  checkSemanticsNeverInvalidateAWire(check);
  checkTheFootgunsAreNamed(check);
  checkEveryFieldNodeSaysWhatItsNumbersMean(check);
}

function checkSemanticsNeverInvalidateAWire(check: CheckReporter): void {
  const fieldSources = allNodeTypes().filter(
    (def) => outputKindOf(def, defaultParams(def)) === 'field',
  );
  const fieldInputs = allNodeTypes().flatMap((def) =>
    Object.entries(def.inputs)
      .filter(([, spec]) => spec.kind === 'field')
      .map(([name]) => ({ type: def.type, name })),
  );
  const everyPairStillWires = fieldSources.every((source) =>
    fieldInputs.every(({ type, name }) => {
      const state = { ...emptyPipeline(), nodes: [instanceOf(source.type, 'a'), instanceOf(type, 'b')] };
      return isWireValid(state, 1, inputSpec(type, name), 'a');
    }),
  );
  check(
    'every field output still wires into every field input, so no stored world can lose a wire to a semantic',
    fieldSources.length > 0 && fieldInputs.length > 0 && everyPairStillWires,
  );
}

function checkTheFootgunsAreNamed(check: CheckReporter): void {
  check(
    'wiring island birth years into a field written for 0..1 warns instead of passing silently',
    wiringMismatch(instanceOf('islandBirthField', 'a'), inputSpec('combineFields', 'a')) !== null,
  );
  check(
    'wiring travel cost into a field that clamps to 0..1 warns',
    wiringMismatch(instanceOf('travelCostField', 'a'), inputSpec('combineFields', 'b')) !== null,
  );
  check(
    'travel cost wired into the input written to read it says nothing',
    wiringMismatch(instanceOf('travelCostField', 'a'), inputSpec('settlementSpread', 'travelCost')) === null,
  );
  check(
    'a plain noise field wired where elevation is expected says nothing, since both are 0..1 readings',
    wiringMismatch(instanceOf('noiseField', 'a'), inputSpec('flowAccumulation', 'elevation')) === null,
  );
  check(
    'a custom script, which can promise nothing about its numbers, is never warned about',
    wiringMismatch(instanceOf('customScript', 'a'), inputSpec('combineFields', 'a')) === null,
  );
}

function checkEveryFieldNodeSaysWhatItsNumbersMean(check: CheckReporter): void {
  const unannotated = allNodeTypes().filter(
    (def) =>
      outputKindOf(def, defaultParams(def)) === 'field' &&
      outputSemanticOf(def, defaultParams(def)) === undefined,
  );
  check(
    'every node that outputs a field says what its numbers mean',
    unannotated.length === 0,
  );
}

export function checkPointAttributes(check: CheckReporter): void {
  check(
    'a points node that never writes a birth date is called out when a time filter reads it',
    wiringMismatch(instanceOf('scatterPoints', 'a'), inputSpec('bornFilter', 'source')) !== null,
  );
  check(
    'the node that founds villages over time satisfies the same filter',
    wiringMismatch(instanceOf('settlementSpread', 'a'), inputSpec('bornFilter', 'source')) === null,
  );
  check(
    'scattered points fed to the volcano cone field, which invents a radius for them, are called out',
    wiringMismatch(instanceOf('scatterPoints', 'a'), inputSpec('volcanoConeField', 'volcanoes')) !== null,
  );
  check(
    'hotspot volcanoes carry everything the cone field reads',
    wiringMismatch(instanceOf('hotspotChain', 'a'), inputSpec('volcanoConeField', 'volcanoes')) === null,
  );
  check(
    'a custom script, which cannot declare what its points carry, is never called out',
    wiringMismatch(instanceOf('customScript', 'a'), inputSpec('bornFilter', 'source')) === null,
  );
  check(
    'a missing attribute is a warning, never an invalid wire',
    isWireValid(
      { ...emptyPipeline(), nodes: [instanceOf('scatterPoints', 'a'), instanceOf('bornFilter', 'b')] },
      1,
      inputSpec('bornFilter', 'source'),
      'a',
    ),
  );
  const declaredKeys = new Set(
    allNodeTypes().flatMap((def) => (def.pointAttributes ?? []).map((attr) => attr.key)),
  );
  const unknownRequirements = allNodeTypes().flatMap((def) =>
    Object.values(def.inputs).flatMap((spec) =>
      (spec.requiresPointAttributes ?? []).filter((key) => !declaredKeys.has(key)),
    ),
  );
  check(
    'every point attribute an input asks for is one some node actually declares',
    declaredKeys.size > 0 && unknownRequirements.length === 0,
  );
}
