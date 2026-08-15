import { useState } from 'react';
import { ConfirmModal } from '@/features/app-shell/controls/ConfirmModal';
import { IconButton } from '@/features/app-shell/controls/IconButton';
import { classes } from '@/features/app-shell/controls/classes';
import { REVEALED_ON_ROW_HOVER } from '@/features/app-shell/controls/revealOnRowHover';
import { DuplicateIcon, InsertIcon, RunIcon, TrashIcon } from '@/features/app-shell/icons/rowActionIcons';
import { deleteRowConfirmation, deleteRowTip, duplicateRowTip, insertRowTip, runRowTip } from '../help/rowActionTips';
import type { LibraryEntry } from './entries/libraryEntry';

const ACTION_BUTTON_CLASSES = 'h-5 w-5 rounded-sm border-transparent bg-transparent';

export function LibraryRowActions({ entry }: { entry: LibraryEntry }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  return (
    <span className="flex shrink-0 items-center gap-0.5">
      {entry.insert && (
        <IconButton
          className={classes(REVEALED_ON_ROW_HOVER, ACTION_BUTTON_CLASSES)}
          tip={insertRowTip(entry.name)}
          onClick={entry.insert}
        >
          <InsertIcon />
        </IconButton>
      )}
      {entry.duplicate && (
        <IconButton
          className={classes(REVEALED_ON_ROW_HOVER, ACTION_BUTTON_CLASSES)}
          tip={duplicateRowTip(entry.name)}
          onClick={entry.duplicate}
        >
          <DuplicateIcon />
        </IconButton>
      )}
      {entry.remove && (
        <IconButton
          className={classes(
            REVEALED_ON_ROW_HOVER,
            ACTION_BUTTON_CLASSES,
            'hover:text-danger-ink',
          )}
          tip={deleteRowTip(entry.name)}
          onClick={() => setConfirmingDelete(true)}
        >
          <TrashIcon />
        </IconButton>
      )}
      {entry.run && (
        <IconButton
          active={entry.running}
          className={classes(
            entry.running ? undefined : REVEALED_ON_ROW_HOVER,
            ACTION_BUTTON_CLASSES,
          )}
          tip={runRowTip(entry.name, entry.running === true)}
          onClick={entry.run}
        >
          <RunIcon />
        </IconButton>
      )}
      {confirmingDelete && entry.remove && (
        <ConfirmModal
          {...deleteRowConfirmation(entry.name)}
          onConfirm={() => {
            setConfirmingDelete(false);
            entry.remove?.();
          }}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </span>
  );
}
