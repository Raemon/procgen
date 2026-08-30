import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { familySeeds, pipelineStructureKey } from '../seedFamily';

export function checkSeedFamily(check: CheckReporter): void {
  const first = familySeeds(1234, 6);
  const again = familySeeds(1234, 6);
  check(
    'a seed family is determined by its origin, so the same origin always offers the same rolls',
    first.join() === again.join(),
  );
  check('the first cell is the origin seed itself', first[0] === 1234);
  check('every cell in the family has a different seed', new Set(first).size === first.length);
  check(
    'asking for more cells keeps the rolls already shown',
    familySeeds(1234, 8).slice(0, 6).join() === first.join(),
  );
  check(
    'a different origin grows a different family',
    familySeeds(1234, 6).join() !== familySeeds(5678, 6).join(),
  );
  check(
    'the structure key names each node by id and type, so a rewired pipeline is a new family',
    pipelineStructureKey({
      nodes: () => [
        { id: 'a', type: 'noiseField' },
        { id: 'b', type: 'threshold' },
      ],
    }) === 'a:noiseField,b:threshold',
  );
}
