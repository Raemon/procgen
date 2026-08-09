import { useState } from 'react';
import { ConfirmModal } from '../../frontend/controls/ConfirmModal';
import { IconButton } from '../../frontend/controls/IconButton';
import { classes } from '../../frontend/controls/classes';
import { REVEALED_ON_ROW_HOVER } from '../../frontend/controls/revealOnRowHover';
import { DuplicateIcon, TrashIcon } from '../../frontend/icons/rowActionIcons';
import { deleteRowConfirmation, deleteRowTip, duplicateRowTip } from '../help/rowActionTips';
import type { LibraryEntry } from './entries/libraryEntry';

const ACTION_BUTTON_CLASSES = 'h-5 w-5 rounded-sm border-transparent bg-transparent';

export function LibraryRowActions({ entry }: { entry: LibraryEntry }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  return (
    <span className="flex shrink-0 items-center gap-0.5">
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
