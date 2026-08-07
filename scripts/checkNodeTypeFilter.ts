import '../src/procgen/nodes';
import { nodeTypesByCategory } from '../src/procgen/nodeRegistry';
import { firstNodeTypeIn, nodeTypesMatching } from '../src/ui/procgenPanel/nodeTypeSearch';

checkAnEmptyFilterShowsTheWholeCatalogue();
checkFilteringByTitleKeepsOnlyMatches();
checkFilteringByCategoryKeepsThatWholeCategory();
checkEnterHasSomethingToAddWheneverAnythingMatches();
checkAnUnmatchedFilterLeavesNothingToAdd();
console.log('node type filter: all checks passed');

function checkAnEmptyFilterShowsTheWholeCatalogue(): void {
  assert(
    countIn(nodeTypesMatching('')) === countIn(nodeTypesByCategory()),
    'an empty filter offers every node type',
  );
  assert(countIn(nodeTypesMatching('   ')) === countIn(nodeTypesByCategory()), 'so does whitespace');
}

function checkFilteringByTitleKeepsOnlyMatches(): void {
  const matches = nodeTypesMatching('noise');
  assert(countIn(matches) > 0, 'filtering by a word in a title finds node types');
  assert(
    [...matches.values()].flat().every((def) => `${def.title} ${def.type}`.toLowerCase().includes('noise')),
    'every offered type actually matches what was typed',
  );
}

function checkFilteringByCategoryKeepsThatWholeCategory(): void {
  const [category, defs] = [...nodeTypesByCategory()][0]!;
  assert(
    nodeTypesMatching(category.toUpperCase()).get(category)?.length === defs.length,
    'filtering by a category name keeps that category whole, whatever the case',
  );
}

function checkEnterHasSomethingToAddWheneverAnythingMatches(): void {
  const matches = nodeTypesMatching('noise');
  assert(firstNodeTypeIn(matches) !== undefined, 'enter adds the first match');
}

function checkAnUnmatchedFilterLeavesNothingToAdd(): void {
  const matches = nodeTypesMatching('no node is called this');
  assert(matches.size === 0, 'a filter nothing matches offers nothing');
  assert(firstNodeTypeIn(matches) === undefined, 'and enter does not add a node behind your back');
}

function countIn(byCategory: Map<string, unknown[]>): number {
  return [...byCategory.values()].reduce((total, defs) => total + defs.length, 0);
}

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`ok   ${message}`);
    return;
  }
  console.error(`FAIL ${message}`);
  process.exit(1);
}
