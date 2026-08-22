import { assetId } from '@/features/asset-library/asset';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { allCommands } from '@/features/app-shell/runtime/commands/commandCatalog';
import type { CommandSpec } from '@/features/app-shell/runtime/commands/command';
import {
  HIP_ROOF,
  MAX_STORY_LAYERS,
  MAX_WINDOW_EVERY,
  MIN_STORY_LAYERS,
  MIN_WINDOW_EVERY,
  newCultureWithId,
  type Culture,
} from '@/features/asset-library/cultures/cultureDef';
import { CULTURE_PROPORTION_KNOBS } from '@/features/asset-library/cultures/cultureProportionKnobs';
import { boundRolesSummaryOf, proportionsSummaryOf } from '@/features/asset-library/cultures/cultureSummary';
import { CULTURE_TILE_SLOTS } from '@/features/asset-library/cultures/cultureTileSlots';
import {
  pieceIdsWithPieceToggled,
  pieceOffersPerRole,
  piecesOfferedForRole,
} from '@/features/asset-library/cultures/pieceOffersPerRole';
import { roleBindingsWithoutPiece } from '@/features/asset-library/cultures/forgetRemovedPieceInRoleBindings';
import { ROOF_STYLE_CHOICES, roofStyleLabel } from '@/features/asset-library/cultures/roofStyleChoices';
import { CULTURE_DRAWERS, CULTURE_PANELS } from '@/features/asset-library/cultures/editor/cultureDrawers';
import { newPieceWithId, type Piece, type PieceRole } from '@/features/asset-library/pieces/pieceDef';
import { isOneOf } from '@/features/app-shell/state/persistedUiGuards';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';

const CULTURES_PANEL_SOURCES = [
  join('src', 'features', 'asset-library', 'cultures', 'editor'),
  join('src', 'features', 'asset-library', 'panel', 'folders'),
  join('src', 'features', 'asset-library', 'detail'),
  join('src', 'features', 'asset-library', 'panel', 'entries'),
];
const PERFORMED_ACTION = /perform\('([a-z_]+)'/g;
const CULTURE_ABILITY_ACTIONS = [
  'add_culture',
  'rename_culture',
  'duplicate_culture',
  'remove_culture',
  'set_culture_tiles',
  'set_culture_numbers',
  'bind_culture_role',
];

export function checkCultureEditing(check: CheckReporter): void {
  checkEveryCultureCommandIsReachableFromThePanel(check);
  checkTheDrawersSurviveAReload(check);
  checkTheKnobsCoverEveryParamTheCommandsTake(check);
  checkPiecesAreOfferedToTheRolesTheyWereAuthoredFor(check);
  checkADeletedPieceLeavesNoBindingBehind(check);
  checkARowSaysWhatTheCultureWillBuild(check);
}

function checkEveryCultureCommandIsReachableFromThePanel(check: CheckReporter): void {
  const performed = actionsPerformedInThePanel();
  check(
    'the culture commands are registered where this check can read them, so it cannot pass by finding none',
    CULTURE_ABILITY_ACTIONS.every((action) => cultureCommands().some((spec) => spec.action === action)),
  );
  const unreachable = cultureCommands()
    .map((spec) => spec.action)
    .filter((action) => !performed.includes(action));
  report('culture commands no control in the cultures panel performs', unreachable);
  check(
    'every registered culture command is performed from the cultures panel, so none is left with no way to reach it',
    unreachable.length === 0,
  );
  check(
    'every command named for a culture tells a human where its control lives',
    commandsNamedForCultures().every((spec) => spec.humanControl.includes('cultures')),
  );
}

function checkTheDrawersSurviveAReload(check: CheckReporter): void {
  const isPanel = isOneOf(CULTURE_PANELS);
  check(
    'each culture drawer names a panel the persisted ui guard accepts, so a stored drawer reopens',
    CULTURE_DRAWERS.every((drawer) => isPanel(drawer.panel)) &&
      CULTURE_DRAWERS.length === CULTURE_PANELS.length - 1,
  );
  const decidingWhichDrawerIsOpen = panelComponentSourcesMentioning('CULTURE_PANELS');
  check(
    'whichever culture drawer is open comes from persisted ui state, not a useState a reload forgets',
    decidingWhichDrawerIsOpen.length > 0 &&
      decidingWhichDrawerIsOpen.every(
        (source) => source.includes('usePersistedOpenPanel') && !source.includes('useState'),
      ),
  );
  const deletingACulture = panelComponentSourcesMentioning("perform('remove_culture'");
  check(
    'deleting a culture forgets its drawer, so a later culture handed the same id does not inherit it',
    deletingACulture.length > 0 && deletingACulture.every(forgetsTheDrawerItDeletes),
  );
}

function forgetsTheDrawerItDeletes(source: string): boolean {
  return source.includes('forgetRow()') || source.includes('forgetOpenPanelOfRow(');
}

function checkTheKnobsCoverEveryParamTheCommandsTake(check: CheckReporter): void {
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
    'the proportion sliders stop where the command clamps, so no slider asks for a value it cannot keep',
    JSON.stringify(CULTURE_PROPORTION_KNOBS.map((knob) => [knob.min, knob.max])) ===
      JSON.stringify([
        [MIN_STORY_LAYERS, MAX_STORY_LAYERS],
        [MIN_WINDOW_EVERY, MAX_WINDOW_EVERY],
      ]),
  );
}

function checkPiecesAreOfferedToTheRolesTheyWereAuthoredFor(check: CheckReporter): void {
  const door = pieceWithRole(1, 'door');
  const window = pieceWithRole(2, 'window');
  const culture = newCultureWithId(assetId<'cultures'>(0));
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
  check('binding a piece to a role adds it in ascending id order', JSON.stringify(pieceIdsWithPieceToggled([3, 7].map(assetId<'pieces'>), assetId<'pieces'>(5))) === '[3,5,7]');
  check('clicking a bound piece again unbinds just that piece', JSON.stringify(pieceIdsWithPieceToggled([3, 5, 7].map(assetId<'pieces'>), assetId<'pieces'>(5))) === '[3,7]');
}

function checkARowSaysWhatTheCultureWillBuild(check: CheckReporter): void {
  const culture = newCultureWithId(assetId<'cultures'>(0));
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
    'a culture row reads its roof style out of the choices the roof picker offers, not a second copy',
    ROOF_STYLE_CHOICES.every((choice) => roofStyleLabel(choice.value) === choice.label),
  );
}

function checkADeletedPieceLeavesNoBindingBehind(check: CheckReporter): void {
  const culture = boundTo(boundTo(newCultureWithId(assetId<'cultures'>(0)), 'door', [1, 2]), 'window', [2]);
  check(
    'forgetting a deleted piece drops it from every role it was bound to and leaves the rest bound',
    JSON.stringify(roleBindingsWithoutPiece(culture, assetId<'pieces'>(2))) === JSON.stringify({ door: [1], window: [] }),
  );
}

function cultureCommands(): CommandSpec[] {
  return allCommands().filter(
    (spec) =>
      spec.action.includes('culture') ||
      spec.humanControl.includes('cultures') ||
      (spec.group === 'assets' && 'culture_id' in spec.params),
  );
}

function commandsNamedForCultures(): CommandSpec[] {
  return allCommands().filter((spec) => spec.action.includes('culture'));
}

function editableParamsOf(action: string): string[] {
  const spec = allCommands().find((each) => each.action === action);
  return Object.keys(spec?.params ?? {}).filter((param) => param !== 'culture_id');
}

function actionsPerformedInThePanel(): string[] {
  return panelSourceFiles().flatMap((path) =>
    [...readFileSync(path, 'utf8').matchAll(PERFORMED_ACTION)].map((match) => match[1]!),
  );
}

function panelComponentSourcesMentioning(what: string): string[] {
  return panelSourceFiles()
    .filter((path) => path.endsWith('.tsx'))
    .map((path) => readFileSync(path, 'utf8'))
    .filter((source) => source.includes(what));
}

function panelSourceFiles(): string[] {
  return CULTURES_PANEL_SOURCES.flatMap(sourceFilesUnder);
}

function sourceFilesUnder(root: string): string[] {
  return readdirSync(root).flatMap((entry) => {
    const path = join(root, entry);
    if (statSync(path).isDirectory()) return sourceFilesUnder(path);
    return path.endsWith('.ts') || path.endsWith('.tsx') ? [path] : [];
  });
}

function pieceWithRole(id: number, role: PieceRole): Piece {
  return { ...newPieceWithId(assetId<'pieces'>(id)), role };
}

function boundTo(culture: Culture, role: PieceRole, ids: number[]): Culture {
  const pieceIds = ids.map(assetId<'pieces'>);
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
