import {
  commandFailed,
  commandSucceeded,
  type CommandContext,
  type CommandParams,
  type CommandResult,
  type CommandSpec,
} from '@/features/app-shell/runtime/commands/command';
import { createCommandCollection } from '@/features/app-shell/runtime/commands/commandCollection';
import {
  listOf,
  readOptionalText,
  readText,
} from '@/features/app-shell/runtime/commands/commandParams';
import { isLibraryFolder, LIBRARY_FOLDERS, type LibraryFolder } from '../librarySelection';

const { define: registerCommand, commands: folderCommands } = createCommandCollection();
export { folderCommands };

const SECTION_HELP = `the library section that owns the folder, one of: ${listOf(LIBRARY_FOLDERS)}`;
const FOLDER_ID_HELP = 'id of a folder — see GET /api/v1/asset-library/folders';

function registerFolderCommand(
  spec: Omit<CommandSpec, 'mode' | 'group' | 'changesWorld'>,
): CommandSpec {
  return registerCommand({ ...spec, mode: 'god', group: 'assets', changesWorld: true });
}

registerFolderCommand({
  action: 'add_asset_folder',
  humanControl: 'asset library: + folder at the foot of a section',
  description:
    'Make a folder inside one section of the asset library, so its assets can be filed instead of listed flat. Give parent_id to nest it inside another folder of the same section.',
  params: {
    section: { kind: 'text', help: SECTION_HELP },
    name: { kind: 'text', help: 'what the folder is called' },
    parent_id: { kind: 'text', help: `${FOLDER_ID_HELP}; omit for a folder at the top of the section`, optional: true },
  },
  example: { action: 'add_asset_folder', section: 'worlds', name: 'Round 1' },
  apply: (context, params) => {
    const section = readSection(params);
    if (!section.ok) return section.failure;
    const name = readText(params, 'name');
    if (!name.ok) return name.failure;
    const parentId = optionalFolderId(params, 'parent_id');
    const folder = context.assetFolders.add(section.value, name.value, parentId);
    return commandSucceeded(`added folder ${folder.id} ('${folder.name}') in ${section.value}`);
  },
});

registerFolderCommand({
  action: 'rename_asset_folder',
  humanControl: 'asset library: the name on a folder row',
  description: 'Rename a folder. Assets are filed by folder id, so renaming never unfiles anything.',
  params: {
    folder_id: { kind: 'text', help: FOLDER_ID_HELP },
    name: { kind: 'text', help: 'the new name' },
  },
  example: { action: 'rename_asset_folder', folder_id: 'round-1', name: 'Round 2' },
  apply: (context, params) =>
    withFolderId(context, params, (folderId) => {
      const name = readText(params, 'name');
      if (!name.ok) return name.failure;
      context.assetFolders.rename(folderId, name.value);
      return commandSucceeded(`folder ${folderId} renamed to '${name.value}'`);
    }),
});

registerFolderCommand({
  action: 'remove_asset_folder',
  humanControl: 'asset library: 🗑 on a folder row',
  description:
    'Delete a folder. Everything inside it — assets and nested folders alike — moves up to whatever held the folder, so nothing is lost.',
  params: { folder_id: { kind: 'text', help: FOLDER_ID_HELP } },
  example: { action: 'remove_asset_folder', folder_id: 'round-1' },
  apply: (context, params) =>
    withFolderId(context, params, (folderId) => {
      context.assetFolders.remove(folderId);
      return commandSucceeded(`removed folder ${folderId}`);
    }),
});

registerFolderCommand({
  action: 'move_asset_folder',
  humanControl: 'asset library: drag a folder row onto another folder or between two of them',
  description:
    'Re-nest a folder, or reorder it among its siblings. Omit parent_id to put it at the top of its section; before_id names the sibling it should land in front of.',
  params: {
    folder_id: { kind: 'text', help: FOLDER_ID_HELP },
    parent_id: { kind: 'text', help: `${FOLDER_ID_HELP}; omit to move it to the top of its section`, optional: true },
    before_id: { kind: 'text', help: 'id of the folder it should sit in front of; omit to put it last', optional: true },
  },
  example: { action: 'move_asset_folder', folder_id: 'round-1' },
  apply: (context, params) =>
    withFolderId(context, params, (folderId) => {
      const parentId = optionalFolderId(params, 'parent_id');
      const beforeId = readOptionalText(params, 'before_id');
      const moved = context.assetFolders.move(folderId, parentId, beforeId || undefined);
      if (!moved) {
        return commandFailed(
          'invalid_move',
          'a folder can only move within its own section, and never inside itself',
        );
      }
      return commandSucceeded(`moved folder ${folderId} under ${parentId ?? 'the section'}`);
    }),
});

registerFolderCommand({
  action: 'file_asset',
  humanControl: 'asset library: drag an asset row onto a folder, or back onto the section header',
  description:
    'File one asset in a folder of its section. Omit folder_id to take it out of every folder and list it beside the section again.',
  params: {
    section: { kind: 'text', help: SECTION_HELP },
    key: { kind: 'text', help: 'the asset key: the name for a world or node group, the id for everything else' },
    folder_id: { kind: 'text', help: `${FOLDER_ID_HELP}; omit to unfile the asset`, optional: true },
  },
  example: { action: 'file_asset', section: 'worlds', key: '61 morburmere (evolved)', folder_id: 'round-1' },
  apply: (context, params) => {
    const section = readSection(params);
    if (!section.ok) return section.failure;
    const key = readText(params, 'key');
    if (!key.ok) return key.failure;
    const folderId = optionalFolderId(params, 'folder_id');
    if (!context.assetFolders.place(section.value, key.value, folderId)) {
      return commandFailed('unknown_asset_folder', `no folder ${folderId} in ${section.value}`);
    }
    return commandSucceeded(
      folderId === null
        ? `unfiled ${section.value} '${key.value}'`
        : `filed ${section.value} '${key.value}' in folder ${folderId}`,
    );
  },
});

type SectionRead = { ok: true; value: LibraryFolder } | { ok: false; failure: CommandResult };

function readSection(params: CommandParams): SectionRead {
  const section = readText(params, 'section');
  if (!section.ok) return section;
  if (!isLibraryFolder(section.value)) {
    return {
      ok: false,
      failure: commandFailed('invalid_value', `section must be one of: ${listOf(LIBRARY_FOLDERS)}`),
    };
  }
  return { ok: true, value: section.value };
}

function optionalFolderId(params: CommandParams, name: string): string | null {
  return readOptionalText(params, name) || null;
}

function withFolderId(
  context: CommandContext,
  params: CommandParams,
  use: (folderId: string) => CommandResult,
): CommandResult {
  const read = readText(params, 'folder_id');
  if (!read.ok) return read.failure;
  if (!context.assetFolders.byId(read.value)) {
    return commandFailed(
      'unknown_asset_folder',
      `folder_id must be one of: ${listOf(context.assetFolders.all().map((folder) => folder.id))}`,
    );
  }
  return use(read.value);
}
