/** Put on the row; its revealed children stay invisible until that row is pointed at. */
export const ROW_HOVER_GROUP = 'group/row';

/** Keeps its space in the row, so revealing an action never shifts the controls beside it. */
export const REVEALED_ON_ROW_HOVER =
  'opacity-0 transition-opacity group-hover/row:opacity-100 group-focus-within/row:opacity-100';

/** The folder band wraps rows that have their own hover group, so it names its own. */
export const FOLDER_HOVER_GROUP = 'group/folder';

export const REVEALED_ON_FOLDER_HOVER =
  'opacity-0 transition-opacity group-hover/folder:opacity-100 group-focus-within/folder:opacity-100';
