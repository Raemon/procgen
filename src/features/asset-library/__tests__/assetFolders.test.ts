import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { openApiDocument } from '@/features/app-shell/api/openApiDocument';
import type { CommandContext } from '@/features/app-shell/runtime/commands/command';
import { performCommand } from '@/features/app-shell/runtime/commands/performCommand';
import {
  assetFoldersFromStoredJson,
  nextFolderId,
  type StoredAssetFolders,
} from '../folders/assetFolder';
import { AssetFolders } from '../folders/assetFolders';
import { syncMissingAssetFolders } from '../folders/folderSync';

export function checkAssetFolders(check: CheckReporter): void {
  checkTheSanitizer(check);
  checkFolderMutations(check);
  checkFolderCommands(check);
  checkShippedFolderSync(check);
  checkTheDocumentReachesTheApi(check);
}

function checkTheSanitizer(check: CheckReporter): void {
  const cleaned = assetFoldersFromStoredJson({
    folders: [
      { id: 'a', name: 'keep', section: 'worlds', parentId: null },
      { id: 'b', name: 'nested', section: 'worlds', parentId: 'a' },
      { id: 'c', name: 'orphan', section: 'worlds', parentId: 'nobody' },
      { id: 'd', name: 'stranger', section: 'tiles', parentId: 'a' },
      { id: 'e', name: 7, section: 'worlds', parentId: null },
      { id: 'f', name: 'nowhere', section: 'wardrobes', parentId: null },
      { id: 'a', name: 'twin', section: 'worlds', parentId: null },
    ],
    placements: {
      worlds: { kept: 'a', lost: 'gone', misfiled: 'd' },
      tiles: { '3': 'd' },
      wardrobes: { coat: 'a' },
    },
  });
  check(
    'a folder whose section is not a library section, or whose name is not text, never survives loading',
    cleaned.folders.map((folder) => folder.id).join() === 'a,b,c,d',
  );
  check('a folder pointing at a parent that is gone comes back at the top of its section', folderIn(cleaned, 'c').parentId === null);
  check('a folder cannot hang under a parent from another section', folderIn(cleaned, 'd').parentId === null);
  check('a nested folder keeps the parent it was saved with', folderIn(cleaned, 'b').parentId === 'a');
  check('an asset filed in a folder that is gone, or in another section, comes back unfiled', JSON.stringify(cleaned.placements.worlds) === JSON.stringify({ kept: 'a' }));
  check('a whole section of placements is dropped when nothing in the library answers to that section name', !('wardrobes' in cleaned.placements) && JSON.stringify(cleaned.placements.tiles) === '{"3":"d"}');

  const looping = assetFoldersFromStoredJson({
    folders: [
      { id: 'x', name: 'x', section: 'items', parentId: 'y' },
      { id: 'y', name: 'y', section: 'items', parentId: 'x' },
    ],
    placements: {},
  });
  check(
    'a loop of folders is broken rather than loaded, so the tree always has a root to draw from',
    looping.folders.filter((folder) => folder.parentId === null).length === 1,
  );
  check('loading nothing yields an empty library rather than throwing', assetFoldersFromStoredJson(null).folders.length === 0);
  check('a saved document survives a round trip through the sanitizer unchanged', JSON.stringify(assetFoldersFromStoredJson(cleaned)) === JSON.stringify(cleaned));
  check('a new folder takes the lowest free id', nextFolderId([]) === 'f1' && nextFolderId(cleaned.folders) === 'f1' && nextFolderId([...cleaned.folders, { id: 'f1', name: 'one', section: 'worlds', parentId: null }]) === 'f2');
}

function checkFolderMutations(check: CheckReporter): void {
  const folders = new AssetFolders({ folders: [], placements: {} });
  const round = folders.add('worlds', 'Round 1', null);
  const heats = folders.add('worlds', 'heats', round.id);
  const tiles = folders.add('tiles', 'stone', null);
  check('a folder added under a parent of another section lands at the top of its own section instead', folders.add('worlds', 'loose', tiles.id).parentId === null);
  check('a folder knows its children, and only the ones of its own section', folders.childrenOf('worlds', round.id).length === 1 && folders.childrenOf('tiles', null).length === 1);

  folders.place('worlds', 'islands', heats.id);
  folders.place('worlds', 'dunes', round.id);
  check('an asset filed in a folder reports that folder, and an unfiled one reports none', folders.folderOf('worlds', 'islands') === heats.id && folders.folderOf('worlds', 'caves') === null);
  check('a folder can list the assets filed directly in it', folders.keysIn('worlds', heats.id).join() === 'islands');
  check('an asset cannot be filed in a folder belonging to another section', !folders.place('worlds', 'islands', tiles.id));

  folders.rename(round.id, 'Round One');
  check('renaming a folder leaves everything filed in it exactly where it was', folders.byId(round.id)?.name === 'Round One' && folders.folderOf('worlds', 'dunes') === round.id);

  check('a folder cannot move inside itself or inside one of its own children', !folders.move(round.id, round.id) && !folders.move(round.id, heats.id));
  check('a folder cannot move into another section', !folders.move(heats.id, tiles.id));
  check('a folder moved with no parent lands at the top of its section', folders.move(heats.id, null) && folders.byId(heats.id)?.parentId === null);

  const reordered = new AssetFolders({ folders: [], placements: {} });
  const first = reordered.add('items', 'first', null);
  const second = reordered.add('items', 'second', null);
  reordered.move(second.id, null, first.id);
  check('moving a folder in front of a sibling reorders the two of them', reordered.childrenOf('items', null).map((folder) => folder.name).join() === 'second,first');

  folders.forgetKey('worlds', 'dunes');
  check('forgetting an asset key unfiles it without touching the folder', folders.folderOf('worlds', 'dunes') === null && folders.byId(round.id) !== undefined);
  folders.place('worlds', 'dunes', round.id);
  folders.renameKey('worlds', 'dunes', 'downs');
  check('renaming an asset carries its filing across to the new key', folders.folderOf('worlds', 'downs') === round.id && folders.folderOf('worlds', 'dunes') === null);

  const emptied = new AssetFolders({ folders: [], placements: {} });
  const outer = emptied.add('worlds', 'outer', null);
  const inner = emptied.add('worlds', 'inner', outer.id);
  const deepest = emptied.add('worlds', 'deepest', inner.id);
  emptied.place('worlds', 'a world', inner.id);
  emptied.place('worlds', 'another world', outer.id);
  emptied.remove(inner.id);
  check('deleting a folder hands its children and its assets up to whatever held it', emptied.byId(deepest.id)?.parentId === outer.id && emptied.folderOf('worlds', 'a world') === outer.id);
  emptied.remove(outer.id);
  check('deleting a folder at the top of a section leaves everything it held unfiled', emptied.all().map((folder) => folder.id).join() === deepest.id && emptied.folderOf('worlds', 'another world') === null);
  check('deleting or renaming a folder that is not there is refused rather than guessed at', !emptied.remove('nope') && !emptied.rename('nope', 'x') && !emptied.move('nope', null));
}

function checkFolderCommands(check: CheckReporter): void {
  const assetFolders = new AssetFolders({ folders: [], placements: {} });
  const context = { assetFolders } as unknown as CommandContext;
  const act = (action: string, params: Record<string, unknown> = {}) =>
    performCommand(context, 'god', action, params);

  const added = act('add_asset_folder', { section: 'worlds', name: 'Round 1' });
  const folderId = assetFolders.all()[0]!.id;
  check('add_asset_folder makes the folder and names its id in the summary', added.ok && added.summary.includes(folderId));
  check('a section no library folder answers to is refused', !act('add_asset_folder', { section: 'wardrobes', name: 'coats' }).ok);

  const nested = act('add_asset_folder', { section: 'worlds', name: 'heats', parent_id: folderId });
  const nestedId = assetFolders.all()[1]!.id;
  check('a folder can be added inside another folder of the same section', nested.ok && assetFolders.byId(nestedId)?.parentId === folderId);

  const filed = act('file_asset', { section: 'worlds', key: 'islands', folder_id: nestedId });
  check('file_asset puts one asset in a folder of its section', filed.ok && assetFolders.folderOf('worlds', 'islands') === nestedId);
  check('file_asset with no folder takes the asset back out of every folder', act('file_asset', { section: 'worlds', key: 'islands' }).ok && assetFolders.folderOf('worlds', 'islands') === null);
  check('file_asset names a folder that is not there rather than filing into nothing', !act('file_asset', { section: 'worlds', key: 'islands', folder_id: 'nope' }).ok);

  check('rename_asset_folder renames through the command layer', act('rename_asset_folder', { folder_id: folderId, name: 'Round One' }).ok && assetFolders.byId(folderId)?.name === 'Round One');
  check('move_asset_folder refuses a move that would put a folder inside itself', !act('move_asset_folder', { folder_id: folderId, parent_id: nestedId }).ok);
  check('move_asset_folder with no parent lifts a folder to the top of its section', act('move_asset_folder', { folder_id: nestedId }).ok && assetFolders.byId(nestedId)?.parentId === null);
  check('every folder command refuses a folder id nothing answers to', ['rename_asset_folder', 'remove_asset_folder', 'move_asset_folder'].every((action) => !act(action, { folder_id: 'nope', name: 'x' }).ok));
  check('remove_asset_folder deletes through the command layer', act('remove_asset_folder', { folder_id: folderId }).ok && assetFolders.byId(folderId) === undefined);
}

function checkShippedFolderSync(check: CheckReporter): void {
  const shipped: StoredAssetFolders = {
    folders: [{ id: 'round-1', name: 'Round 1', section: 'worlds', parentId: null }],
    placements: { worlds: { islands: 'round-1', dunes: 'round-1' } },
  };
  const fresh = syncMissingAssetFolders({ folders: [], placements: {} }, shipped);
  check('a database with no folders receives every folder and filing shipped in the repo data files', fresh.addedFolders === 1 && fresh.addedPlacements === 2);

  const renamed: StoredAssetFolders = {
    folders: [{ id: 'round-1', name: 'my heats', section: 'worlds', parentId: null }],
    placements: { worlds: { islands: 'round-1' } },
  };
  const merged = syncMissingAssetFolders(renamed, shipped);
  check('a folder the user renamed keeps that name when the shipped folders sync again', merged.stored.folders[0]!.name === 'my heats' && merged.addedFolders === 0);
  check('a filing the shipped data adds and the database lacked arrives on the next boot', merged.addedPlacements === 1 && merged.stored.placements.worlds?.dunes === 'round-1');

  const moved: StoredAssetFolders = {
    folders: [
      { id: 'round-1', name: 'Round 1', section: 'worlds', parentId: null },
      { id: 'mine', name: 'mine', section: 'worlds', parentId: null },
    ],
    placements: { worlds: { islands: 'mine', dunes: 'round-1' } },
  };
  const again = syncMissingAssetFolders(moved, shipped);
  check('a world the user filed somewhere else stays where they put it', again.stored.placements.worlds?.islands === 'mine');
  check('syncing a database that already holds everything shipped changes nothing', again.addedFolders === 0 && again.addedPlacements === 0);
}

function checkTheDocumentReachesTheApi(check: CheckReporter): void {
  const paths = (openApiDocument() as { paths: Record<string, Record<string, unknown>> }).paths;
  check(
    'asset folders are read and written over their own canonical URL, described in the OpenAPI document',
    paths['/asset-library/folders']?.get !== undefined && paths['/asset-library/folders']?.put !== undefined,
  );
}

function folderIn(stored: StoredAssetFolders, id: string) {
  const folder = stored.folders.find((candidate) => candidate.id === id);
  if (!folder) throw new Error(`missing folder ${id}`);
  return folder;
}
