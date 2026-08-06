import '../src/abilities/index';
import { performAbility } from '../src/abilities/performAbility';
import type { AbilityContext } from '../src/abilities/ability';
import { LANGUAGE_CONCEPTS } from '../src/language/concepts';
import { compoundWord } from '../src/language/compounds';
import { buildLexicon } from '../src/language/lexicon';
import { editDistance, hearUtterance } from '../src/language/nearestWord';
import { PipelineEvaluator } from '../src/procgen/eval/evaluator';
import { nodeTypeOf } from '../src/procgen/nodeRegistry';
import { PipelineStore } from '../src/procgen/pipeline/pipelineStore';
import { sanitizePipeline } from '../src/procgen/pipeline/sanitizePipeline';
import { examplePipelines } from '../src/procgen/presets/examplePipelines';
import { WorldSampler, type Marker } from '../src/procgen/worldSampler';
import { CreatureLibrary } from '../src/creatures/creatureLibrary';
import { PrefabLibrary } from '../src/prefabs/prefabLibrary';
import { WorldPresetLibrary } from '../src/procgen/presets/worldPresetLibrary';
import { RandomizeHistory } from '../src/procgen/randomize/randomizeHistory';
import { TemplateLibrary } from '../src/procgen/templates/templateLibrary';
import { NO_PREFABS } from '../src/procgen/prefabOverlay/prefabOverlay';
import { SpokenWorldLedger } from '../src/spokenWorld/spokenWorldLedger';
import { vaultKeyConcept } from '../src/spokenWorld/vaultKeyConcept';
import { vaultCellAt } from '../src/spokenWorld/vaultLayout';
import { Tileset } from '../src/world/tiles/tileset';
import { isWalkableTile } from '../src/world/tileWalkability';
import type { CheckReporter } from './checkPrefabAndCreatureInvariants';

const VAULT_SCAN_REACH = 192;

export function checkSpokenWorldInvariants(check: CheckReporter): void {
  checkLexiconInvariants(check);
  checkHearingInvariants(check);
  checkLanguageNodesRegistered(check);
  checkSpokenWorldEndToEnd(check);
}

function checkLexiconInvariants(check: CheckReporter): void {
  const lexicon = buildLexicon(20);
  const again = buildLexicon(20);
  const other = buildLexicon(21);
  const words = LANGUAGE_CONCEPTS.map((concept) => lexicon[concept]);
  check('the same seed always speaks the same language', LANGUAGE_CONCEPTS.every((concept) => lexicon[concept] === again[concept]));
  check('different seeds speak different languages', LANGUAGE_CONCEPTS.some((concept) => lexicon[concept] !== other[concept]));
  check('every concept has a pronounceable root', words.every((word) => word.length >= 3 && /[^aeiou]/.test(word)));
  check('no root is a prefix of another root', words.every((word, i) => words.every((held, j) => i === j || (!held.startsWith(word) && !word.startsWith(held)))));
  check('compounds join a clipped modifier onto a whole head', compoundWord(lexicon, 'high', 'stone').endsWith(lexicon.stone));
}

function checkHearingInvariants(check: CheckReporter): void {
  const lexicon = buildLexicon(20);
  const exact = hearUtterance(lexicon, lexicon.water);
  const slurred = hearUtterance(lexicon, lexicon.water + 'a');
  check('a true word is heard at distance zero', exact.concept === 'water' && exact.distance === 0);
  check('a near-miss is heard as its nearest real word', slurred.word === lexicon.water && slurred.distance === 1);
  check('edit distance is a metric on simple cases', editDistance('abc', 'abc') === 0 && editDistance('abc', 'abd') === 1 && editDistance('abc', '') === 3);
}

function checkLanguageNodesRegistered(check: CheckReporter): void {
  const registered = ['namePlaces', 'standingStones', 'wordVaults'].map((type) => nodeTypeOf(type));
  check('the three language node types are registered as points nodes', registered.every((def) => def?.output === 'points'));
}

function checkSpokenWorldEndToEnd(check: CheckReporter): void {
  const world = spokenWorldFixture();
  const vault = firstVault(world.sampler);
  check('the spoken world preset raises at least one vault near the origin', vault !== null);
  if (!vault) return;
  checkVaultSealAndOpening(check, world, vault);
}

interface SpokenWorldFixture {
  sampler: WorldSampler;
  ledger: SpokenWorldLedger;
  tileset: Tileset;
  context: AbilityContext;
  pose: { x: number; y: number };
}

function spokenWorldFixture(): SpokenWorldFixture {
  const preset = examplePipelines().find((pipeline) => pipeline.name === 'the spoken world')!;
  const store = new PipelineStore(sanitizePipeline(preset.state));
  const evaluator = new PipelineEvaluator(store);
  const tileset = new Tileset();
  const ledger = new SpokenWorldLedger();
  const sampler = new WorldSampler(store, evaluator, tileset, NO_PREFABS, (x, y) => ledger.isVaultOpen(x, y));
  const pose = { x: 0, y: 0 };
  const context: AbilityContext = {
    store,
    tileset,
    prefabs: new PrefabLibrary(() => -1),
    creatures: new CreatureLibrary(),
    templates: new TemplateLibrary([]),
    worldPresets: new WorldPresetLibrary([]),
    randomizeHistory: new RandomizeHistory(),
    regionSampler: sampler,
    spokenWorld: ledger,
    placesNear: (minX, minY, maxX, maxY) => sampler.markersIn(minX, minY, maxX, maxY),
    actor: {
      pose: () => ({ x: pose.x, y: pose.y, facing: 0 }),
      tryStep: () => true,
      turn: () => undefined,
    },
  };
  return { sampler, ledger, tileset, context, pose };
}

function firstVault(sampler: WorldSampler): Marker | null {
  const vaults = sampler
    .markersIn(-VAULT_SCAN_REACH, -VAULT_SCAN_REACH, VAULT_SCAN_REACH, VAULT_SCAN_REACH)
    .filter((marker) => marker.tag === 'vault');
  return vaults[0] ?? null;
}

function checkVaultSealAndOpening(check: CheckReporter, world: SpokenWorldFixture, vault: Marker): void {
  const door = { x: vault.x, y: vault.y + 2 };
  const sealedDoorTile = world.sampler.tileAt(door.x, door.y);
  check('a sealed vault door is drawn with an unwalkable wall tile', !isWalkableTile(world.tileset, sealedDoorTile));
  check('the vault layout puts the door on the south wall', vaultCellAt(vault.x, vault.y, door.x, door.y) === 'door');
  world.pose.x = vault.x;
  world.pose.y = vault.y + 4;
  const lexicon = buildLexicon(world.context.store.seed());
  const key = vaultKeyConcept((x, y) => world.sampler.tileAt(x, y), (id) => world.tileset.byId(id), vault.x, vault.y);
  const gibberish = performAbility(world.context, 'character', 'speak', { utterance: 'xyzzyq' });
  check('gibberish is taken by the wind', gibberish.ok && gibberish.summary.includes('wind') && !world.ledger.isVaultOpen(vault.x, vault.y));
  const trueWord = performAbility(world.context, 'character', 'speak', { utterance: lexicon[key] });
  check('speaking the true name of the land opens the vault', trueWord.ok && world.ledger.isVaultOpen(vault.x, vault.y));
  const openedDoorTile = world.sampler.tileAt(door.x, door.y);
  check('an opened vault door becomes passable ground', openedDoorTile !== sealedDoorTile);
  checkNamedPlacesSpeakTheWorldTongue(check, world, lexicon.water);
}

function checkNamedPlacesSpeakTheWorldTongue(check: CheckReporter, world: SpokenWorldFixture, waterWord: string): void {
  const named = world.sampler
    .markersIn(-VAULT_SCAN_REACH, -VAULT_SCAN_REACH, VAULT_SCAN_REACH, VAULT_SCAN_REACH)
    .filter((marker) => marker.tag.includes('(town)'));
  check('towns near rivers carry names ending in the water root', named.length > 0 && named.every((town) => (town.tag.split(' ')[0] ?? '').endsWith(waterWord)));
}
