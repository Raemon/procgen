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

export function checkAssetFolders(check: CheckReporter): void {
  checkTheSanitizer(check);
  checkFolderMutations(check);
  checkFolderCommands(check);
  checkTheDocumentReachesTheApi(check);
}

function checkTheSanitizer(check: CheckReporter): void {
  const cleaned = assetFoldersFromStoredJson({
    folders: [
      { id: 'a', name: 'keep', section: 'worldSeeds', parentId: null },
      { id: 'b', name: 'nested', section: 'worldSeeds', parentId: 'a' },
      { id: 'c', name: 'orphan', section: 'worldSeeds', parentId: 'nobody' },
      { id: 'd', name: 'stranger', section: 'tiles', parentId: 'a' },
      { id: 'e', name: 7, section: 'worldSeeds', parentId: null },
      { id: 'f', name: 'nowhere', section: 'wardrobes', parentId: null },
      { id: 'a', name: 'twin', section: 'worldSeeds', parentId: null },
    ],
    placements: {
      worldSeeds: { kept: 'a', lost: 'gone', misfiled: 'd' },
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
  check('an asset filed in a folder that is gone, or in another section, comes back unfiled', JSON.stringify(cleaned.placements.worldSeeds) === JSON.stringify({ kept: 'a' }));
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
  check('a new folder takes the lowest free id', nextFolderId([]) === 'f1' && nextFolderId(cleaned.folders) === 'f1' && nextFolderId([...cleaned.folders, { id: 'f1', name: 'one', section: 'worldSeeds', parentId: null }]) === 'f2');
}

function checkFolderMutations(check: CheckReporter): void {
  const folders = new AssetFolders({ folders: [], placements: {} });
  const round = folders.add('worldSeeds', 'Round 1', null);
  const heats = folders.add('worldSeeds', 'heats', round.id);
  const tiles = folders.add('tiles', 'stone', null);
  check('a folder added under a parent of another section lands at the top of its own section instead', folders.add('worldSeeds', 'loose', tiles.id).parentId === null);
  check('a folder knows its children, and only the ones of its own section', folders.childrenOf('worldSeeds', round.id).length === 1 && folders.childrenOf('tiles', null).length === 1);

  folders.place('worldSeeds', 'islands', heats.id);
  folders.place('worldSeeds', 'dunes', round.id);
  check('an asset filed in a folder reports that folder, and an unfiled one reports none', folders.folderOf('worldSeeds', 'islands') === heats.id && folders.folderOf('worldSeeds', 'caves') === null);
  check('a folder can list the assets filed directly in it', folders.keysIn('worldSeeds', heats.id).join() === 'islands');
  check('an asset cannot be filed in a folder belonging to another section', !folders.place('worldSeeds', 'islands', tiles.id));

  folders.rename(round.id, 'Round One');
  check('renaming a folder leaves everything filed in it exactly where it was', folders.byId(round.id)?.name === 'Round One' && folders.folderOf('worldSeeds', 'dunes') === round.id);

  check('a folder cannot move inside itself or inside one of its own children', !folders.move(round.id, round.id) && !folders.move(round.id, heats.id));
  check('a folder cannot move into another section', !folders.move(heats.id, tiles.id));
  check('a folder moved with no parent lands at the top of its section', folders.move(heats.id, null) && folders.byId(heats.id)?.parentId === null);

  const reordered = new AssetFolders({ folders: [], placements: {} });
  const first = reordered.add('items', 'first', null);
  const second = reordered.add('items', 'second', null);
  reordered.move(second.id, null, first.id);
  check('moving a folder in front of a sibling reorders the two of them', reordered.childrenOf('items', null).map((folder) => folder.name).join() === 'second,first');

  folders.forgetKey('worldSeeds', 'dunes');
  check('forgetting an asset key unfiles it without touching the folder', folders.folderOf('worldSeeds', 'dunes') === null && folders.byId(round.id) !== undefined);
  folders.place('worldSeeds', 'dunes', round.id);
  folders.renameKey('worldSeeds', 'dunes', 'downs');
  check('renaming an asset carries its filing across to the new key', folders.folderOf('worldSeeds', 'downs') === round.id && folders.folderOf('worldSeeds', 'dunes') === null);

  const emptied = new AssetFolders({ folders: [], placements: {} });
  const outer = emptied.add('worldSeeds', 'outer', null);
  const inner = emptied.add('worldSeeds', 'inner', outer.id);
  const deepest = emptied.add('worldSeeds', 'deepest', inner.id);
  emptied.place('worldSeeds', 'a world', inner.id);
  emptied.place('worldSeeds', 'another world', outer.id);
  emptied.remove(inner.id);
  check('deleting a folder hands its children and its assets up to whatever held it', emptied.byId(deepest.id)?.parentId === outer.id && emptied.folderOf('worldSeeds', 'a world') === outer.id);
  emptied.remove(outer.id);
  check('deleting a folder at the top of a section leaves everything it held unfiled', emptied.all().map((folder) => folder.id).join() === deepest.id && emptied.folderOf('worldSeeds', 'another world') === null);
  check('deleting or renaming a folder that is not there is refused rather than guessed at', !emptied.remove('nope') && !emptied.rename('nope', 'x') && !emptied.move('nope', null));
}

function checkFolderCommands(check: CheckReporter): void {
  const assetFolders = new AssetFolders({ folders: [], placements: {} });
  const context = { assetFolders } as unknown as CommandContext;
  const act = (action: string, params: Record<string, unknown> = {}) =>
    performCommand(context, 'god', action, params);

  const added = act('add_asset_folder', { section: 'worldSeeds', name: 'Round 1' });
  const folderId = assetFolders.all()[0]!.id;
  check('add_asset_folder makes the folder and names its id in the summary', added.ok && added.summary.includes(folderId));
  check('a section no library folder answers to is refused', !act('add_asset_folder', { section: 'wardrobes', name: 'coats' }).ok);

  const nested = act('add_asset_folder', { section: 'worldSeeds', name: 'heats', parent_id: folderId });
  const nestedId = assetFolders.all()[1]!.id;
  check('a folder can be added inside another folder of the same section', nested.ok && assetFolders.byId(nestedId)?.parentId === folderId);

  const filed = act('file_asset', { section: 'worldSeeds', key: 'islands', folder_id: nestedId });
  check('file_asset puts one asset in a folder of its section', filed.ok && assetFolders.folderOf('worldSeeds', 'islands') === nestedId);
  check('file_asset with no folder takes the asset back out of every folder', act('file_asset', { section: 'worldSeeds', key: 'islands' }).ok && assetFolders.folderOf('worldSeeds', 'islands') === null);
  check('file_asset names a folder that is not there rather than filing into nothing', !act('file_asset', { section: 'worldSeeds', key: 'islands', folder_id: 'nope' }).ok);

  check('rename_asset_folder renames through the command layer', act('rename_asset_folder', { folder_id: folderId, name: 'Round One' }).ok && assetFolders.byId(folderId)?.name === 'Round One');
  check('move_asset_folder refuses a move that would put a folder inside itself', !act('move_asset_folder', { folder_id: folderId, parent_id: nestedId }).ok);
  check('move_asset_folder with no parent lifts a folder to the top of its section', act('move_asset_folder', { folder_id: nestedId }).ok && assetFolders.byId(nestedId)?.parentId === null);
  check('every folder command refuses a folder id nothing answers to', ['rename_asset_folder', 'remove_asset_folder', 'move_asset_folder'].every((action) => !act(action, { folder_id: 'nope', name: 'x' }).ok));
  check('remove_asset_folder deletes through the command layer', act('remove_asset_folder', { folder_id: folderId }).ok && assetFolders.byId(folderId) === undefined);
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
