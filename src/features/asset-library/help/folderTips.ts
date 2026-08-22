import type { TooltipContent } from '@/features/app-shell/tooltips/tooltipContent';

export const ADD_ASSET_FOLDER_TIP: TooltipContent = {
  title: '+ folder',
  body: 'Files a new, empty folder at the top of this section. Drag assets onto it to put them inside, and drag folders onto each other to nest them.',
};

export function addSubfolderTip(name: string): TooltipContent {
  return {
    title: `+ subfolder in ${name}`,
    body: 'Nests a new folder inside this one. Folders go as deep as you like, within one section.',
  };
}

export function assetFolderTip(name: string, open: boolean): TooltipContent {
  return open
    ? { title: `close ${name}`, body: 'Hides what is filed here. The count on the right stays, nested folders included.' }
    : { title: `open ${name}`, body: 'Shows what is filed here. The count on the right counts nested folders too.' };
}

export const ASSET_FOLDER_NAME_TIP: TooltipContent = {
  title: 'folder name',
  body: 'Click to rename. Enter or clicking away saves it, Esc puts the old name back. Assets are filed by folder id, so a rename never unfiles anything.',
};

export function renameAssetFolderTip(name: string): TooltipContent {
  return { title: `rename ${name}`, body: 'Turns the name into a field you can type over.' };
}

export function deleteAssetFolderTip(name: string): TooltipContent {
  return {
    title: `delete ${name}`,
    body: 'Drops the folder. Everything inside moves up to whatever held it, so no asset is deleted with it.',
  };
}

export function deleteAssetFolderConfirmation(
  name: string,
  count: number,
): { title: string; body: string; confirmLabel: string } {
  return {
    title: `delete ${name}?`,
    body: `${count} filed here move up to whatever holds this folder. Nothing is deleted with it.`,
    confirmLabel: 'delete folder',
  };
}

export function dropIntoSectionTip(section: string): TooltipContent {
  return {
    title: `${section} — drop here to unfile`,
    body: 'Dragging an asset or a folder onto this header takes it out of every folder and lists it beside the section again.',
  };
}
