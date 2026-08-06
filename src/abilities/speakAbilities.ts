import type { LanguageConcept } from '../language/concepts';
import { buildLexicon } from '../language/lexicon';
import { hearUtterance, type HeardWord } from '../language/nearestWord';
import { conceptForTile } from '../language/tileConcepts';
import { vaultKeyConcept } from '../spokenWorld/vaultKeyConcept';
import { abilitySucceeded, type AbilityContext, type AbilityResult } from './ability';
import { readText } from './abilityParams';
import { registerAbility } from './abilityRegistry';

export const EARSHOT_RADIUS = 12;
const PRESENCE_RADIUS = 8;
const MISHEARING_DISTANCE = 2;

const SILENCE = 'the wind takes your words; nothing answers';
const STILL_AIR = 'your word is true, but nothing here answers to it';
const VAULT_OPENS = 'stone grinds on stone: somewhere close, a sealed wall opens';

const PRESENT_ANSWERS: Partial<Record<LanguageConcept, string>> = {
  water: 'ripples cross the water near you',
  stone: 'a low note hums through the rock',
  tree: 'the trees lean in and their leaves hiss',
  grass: 'the grass bows in a ring around you',
  sand: 'sand lifts and whispers past your feet',
  sea: 'far off, the deep water goes glass-still for a breath',
  snow: 'loose snow shivers from its drifts',
  ice: 'the ice creaks like a door',
  marsh: 'the marsh breathes out a cold mist',
  fire: 'the molten rock brightens at your voice',
};

registerAbility({
  action: 'speak',
  mode: 'character',
  group: 'world',
  changesWorld: true,
  humanControl: 'world view: the speak bar under the map',
  description:
    'Say a word aloud where you stand. The world answers what it hears: a true word stirs the thing it names when that thing is near, a near-miss is murmured back corrected, and a sealed vault opens to the true name of the land around it. Nothing is ever translated — learn by listening.',
  params: { utterance: { kind: 'text', help: 'the word to say aloud' } },
  example: { action: 'speak', utterance: 'ranpa' },
  apply: applySpeak,
});

function applySpeak(context: AbilityContext, params: Record<string, unknown>): AbilityResult {
  const utterance = readText(params, 'utterance');
  if (!utterance.ok) return utterance.failure;
  const spoken = utterance.value.toLowerCase().replace(/[^a-z]/g, '');
  if (spoken === '') return abilitySucceeded(SILENCE);
  const heard = hearUtterance(buildLexicon(context.store.seed()), spoken);
  if (heard.distance > MISHEARING_DISTANCE) return abilitySucceeded(SILENCE);
  if (heard.distance > 0) return abilitySucceeded(`the land murmurs something back: "${heard.word}"`);
  return answerTrueWord(context, heard);
}

function answerTrueWord(context: AbilityContext, heard: HeardWord): AbilityResult {
  if (openFirstAnsweringVault(context, heard.concept)) return abilitySucceeded(VAULT_OPENS);
  return abilitySucceeded(presenceAnswer(context, heard.concept));
}

function openFirstAnsweringVault(context: AbilityContext, concept: LanguageConcept): boolean {
  for (const vault of sealedVaultsInEarshot(context)) {
    if (vaultConceptOf(context, vault) === concept) {
      return context.spokenWorld.openVault(vault.x, vault.y);
    }
  }
  return false;
}

function sealedVaultsInEarshot(context: AbilityContext): { x: number; y: number }[] {
  const { x, y } = context.actor.pose();
  return context
    .placesNear(x - EARSHOT_RADIUS, y - EARSHOT_RADIUS, x + EARSHOT_RADIUS, y + EARSHOT_RADIUS)
    .filter((place) => place.tag === 'vault' && !context.spokenWorld.isVaultOpen(place.x, place.y));
}

function vaultConceptOf(context: AbilityContext, vault: { x: number; y: number }): LanguageConcept {
  return vaultKeyConcept(
    (x, y) => context.regionSampler.tileAt(x, y),
    (tileId) => context.tileset.byId(tileId),
    vault.x,
    vault.y,
  );
}

function presenceAnswer(context: AbilityContext, concept: LanguageConcept): string {
  const answer = PRESENT_ANSWERS[concept];
  if (!answer || !conceptIsNearby(context, concept)) return STILL_AIR;
  return answer;
}

function conceptIsNearby(context: AbilityContext, concept: LanguageConcept): boolean {
  const { x, y } = context.actor.pose();
  for (let dy = -PRESENCE_RADIUS; dy <= PRESENCE_RADIUS; dy++) {
    for (let dx = -PRESENCE_RADIUS; dx <= PRESENCE_RADIUS; dx++) {
      const tile = context.tileset.byId(context.regionSampler.tileAt(x + dx, y + dy));
      if (conceptForTile(tile) === concept) return true;
    }
  }
  return false;
}
