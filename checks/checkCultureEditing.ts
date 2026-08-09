import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import '../abilities/index';
import { allAbilities } from '../abilities/abilityRegistry';
import type { AbilitySpec } from '../abilities/ability';
import {
  GABLE_ROOF,
  HIP_ROOF,
  MAX_STORY_LAYERS,
  MAX_WINDOW_EVERY,
  MIN_STORY_LAYERS,
  MIN_WINDOW_EVERY,
  newCultureWithId,
  type Culture,
} from '../assets/cultures/cultureDef';
import { CULTURE_PROPORTION_KNOBS } from '../assets/cultures/cultureProportionKnobs';
import { boundRolesSummaryOf, proportionsSummaryOf } from '../assets/cultures/cultureSummary';
import { CULTURE_TILE_SLOTS } from '../assets/cultures/cultureTileSlots';
import {
  pieceIdsWithPieceToggled,
  pieceOffersPerRole,
  piecesOfferedForRole,
} from '../assets/cultures/pieceOffersPerRole';
import { roofStyleLabel } from '../assets/cultures/roofStyleChoices';
import { CULTURE_DRAWERS, CULTURE_PANELS } from '../assets/cultures/editor/cultureDrawers';
import { newPieceWithId, type Piece, type PieceRole } from '../assets/pieces/pieceDef';
import { isOneOf } from '../frontend/uiState/persistedUiGuards';
import { PERSISTED_UI_KEYS } from '../frontend/uiState/persistedUiKeys';
import type { CheckReporter } from './checkReporter';

const CULTURES_PANEL_SOURCE = join('assets', 'cultures', 'editor');
const PERFORMED_ACTION = /perform\('([a-z_]+)'/g;

export function checkCultureEditing(check: CheckReporter): void {
  checkEveryCultureAbilityIsReachableFromThePanel(check);
  checkTheDrawersSurviveAReload(check);
  checkTheKnobsCoverEveryParamTheAbilitiesTake(check);
  checkPiecesAreOfferedToTheRolesTheyWereAuthoredFor(check);
  checkARowSaysWhatTheCultureWillBuild(check);
}

function checkEveryCultureAbilityIsReachableFromThePanel(check: CheckReporter): void {
  const performed = actionsPerformedInThePanel();
  const unreachable = cultureAbilities()
    .map((spec) => spec.action)
    .filter((action) => !performed.includes(action));
  report('culture abilities no control in the cultures panel performs', unreachable);
  check(
    'every registered culture ability is performed from the cultures panel, so none is left with no way to reach it',
    unreachable.length === 0,
  );
  check(
    'the cultures panel is the whole story on cultures: rename, tiles, numbers, role binding and removal',
    ['rename_culture', 'set_culture_tiles', 'set_culture_numbers', 'bind_culture_role', 'remove_culture'].every(
      (action) => performed.includes(action),
    ),
  );
  check(
    'every culture ability tells a human its control lives in the cultures tab',
    cultureAbilities().every((spec) => spec.humanControl.includes('cultures tab')),
  );
}

function checkTheDrawersSurviveAReload(check: CheckReporter): void {
  const isPanel = isOneOf(CULTURE_PANELS);
  check(
    'each culture drawer names a panel the persisted ui guard accepts, so a stored drawer reopens',
    CULTURE_DRAWERS.every((drawer) => isPanel(drawer.panel)) &&
      CULTURE_DRAWERS.length === CULTURE_PANELS.length - 1,
  );
  check(
    'the open culture drawer is persisted under its own key rather than kept in a bare useState',
    PERSISTED_UI_KEYS.openCulturePanels === 'assets.openCulturePanels' &&
      panelSourceFiles().every((path) => !readFileSync(path, 'utf8').includes('useState')),
  );
}

function checkTheKnobsCoverEveryParamTheAbilitiesTake(check: CheckReporter): void {
  check(
    'the tile pickers cover every tile slot set_culture_tiles takes, so a new slot cannot hide from the panel',
    sameNames(
      CULTURE_TILE_SLOTS.map((slot) => slot.param),
      editableParamsOf('set_culture_tiles'),
    ),
  );
  check(
    'the proportion controls cover every number set_culture_numbers takes, roof style included',
    sameNames(
      ['roof_style', ...CULTURE_PROPORTION_KNOBS.map((knob) => knob.param)],
      editableParamsOf('set_culture_numbers'),
    ),
  );
  check(
    'the proportion sliders stop where the ability clamps, so no slider asks for a value it cannot keep',
    JSON.stringify(CULTURE_PROPORTION_KNOBS.map((knob) => [knob.min, knob.max])) ===
      JSON.stringify([
        [MIN_STORY_LAYERS, MAX_STORY_LAYERS],
        [MIN_WINDOW_EVERY, MAX_WINDOW_EVERY],
      ]),
  );
  check(
    'a tile slot reads the culture field the ability writes',
    CULTURE_TILE_SLOTS.every((slot) => slot.field in newCultureWithId(0)),
  );
}

function checkPiecesAreOfferedToTheRolesTheyWereAuthoredFor(check: CheckReporter): void {
  const door = pieceWithRole(1, 'door');
  const window = pieceWithRole(2, 'window');
  const culture = newCultureWithId(0);
  check(
    'a role is offered the pieces authored for it and nothing else',
    idsOf(piecesOfferedForRole([door, window], culture, 'door')) === '1',
  );
  check(
    'a piece bound to a role it was not authored for stays visible, so an odd binding can be undone',
    idsOf(piecesOfferedForRole([door, window], boundTo(culture, 'door', [1, 2]), 'door')) === '1,2',
  );
  check(
    'roles no piece was authored for are left out of the binding drawer',
    pieceOffersPerRole([door, window], culture)
      .map((offer) => offer.role)
      .join() === 'door,window',
  );
  check('binding a piece to a role adds it in ascending id order', JSON.stringify(pieceIdsWithPieceToggled([3, 7], 5)) === '[3,5,7]');
  check('clicking a bound piece again unbinds just that piece', JSON.stringify(pieceIdsWithPieceToggled([3, 5, 7], 5)) === '[3,7]');
}

function checkARowSaysWhatTheCultureWillBuild(check: CheckReporter): void {
  const culture = newCultureWithId(0);
  check(
    'a culture row reads out the roof style, the story height and the window rhythm',
    proportionsSummaryOf({ ...culture, roofStyle: HIP_ROOF, storyLayers: 4, windowEvery: 2 }) ===
      'hip roof · 4 layers per story · window every 2',
  );
  check(
    'a culture with nothing bound says it will be built from tiles alone',
    boundRolesSummaryOf(culture).includes('tiles alone') &&
      boundRolesSummaryOf(boundTo(culture, 'door', [1])) === 'pieces bound: door',
  );
  check(
    'roof style 0 reads as a gable and 1 as a hip, the way the assembler treats them',
    roofStyleLabel(GABLE_ROOF) === 'gable' && roofStyleLabel(HIP_ROOF) === 'hip',
  );
}

function cultureAbilities(): AbilitySpec[] {
  return allAbilities().filter(
    (spec) => spec.action.includes('culture') || spec.humanControl.includes('cultures tab'),
  );
}

function editableParamsOf(action: string): string[] {
  const spec = allAbilities().find((each) => each.action === action);
  return Object.keys(spec?.params ?? {}).filter((param) => param !== 'culture_id');
}

function actionsPerformedInThePanel(): string[] {
  return panelSourceFiles().flatMap((path) =>
    [...readFileSync(path, 'utf8').matchAll(PERFORMED_ACTION)].map((match) => match[1]!),
  );
}

function panelSourceFiles(): string[] {
  return sourceFilesUnder(CULTURES_PANEL_SOURCE);
}

function sourceFilesUnder(root: string): string[] {
  return readdirSync(root).flatMap((entry) => {
    const path = join(root, entry);
    if (statSync(path).isDirectory()) return sourceFilesUnder(path);
    return path.endsWith('.ts') || path.endsWith('.tsx') ? [path] : [];
  });
}

function pieceWithRole(id: number, role: PieceRole): Piece {
  return { ...newPieceWithId(id), role };
}

function boundTo(culture: Culture, role: PieceRole, pieceIds: number[]): Culture {
  return { ...culture, roleBindings: { ...culture.roleBindings, [role]: pieceIds } };
}

function idsOf(pieces: readonly Piece[]): string {
  return pieces.map((piece) => piece.id).join();
}

function sameNames(left: readonly string[], right: readonly string[]): boolean {
  return JSON.stringify([...left].sort()) === JSON.stringify([...right].sort());
}

function report(what: string, offenders: readonly string[]): void {
  if (offenders.length === 0) return;
  console.log(`     ${what}:\n       ${offenders.join('\n       ')}`);
}
