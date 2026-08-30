import { useState } from 'react';
import type { ReactNode } from 'react';
import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import { Button } from '@/features/app-shell/controls/Button';
import { ConfirmModal } from '@/features/app-shell/controls/ConfirmModal';
import { classes } from '@/features/app-shell/controls/classes';
import { FIELD_CLASSES } from '@/features/app-shell/controls/fieldClasses';
import { tooltipHandlers } from '@/features/app-shell/tooltips/tooltipHandlers';
import { deleteRowConfirmation } from '@/features/asset-library/help/rowActionTips';
import { useLibrarySelection } from '@/features/asset-library/panel/useLibrarySelection';
import type { Culture } from '../cultureDef';
import { CultureProportionSliders } from './CultureProportionSliders';
import { CultureRoleBindings } from './CultureRoleBindings';
import { CultureTileChoices } from './CultureTileChoices';
import {
  CULTURE_NAME_TIP,
  CULTURE_PIECES_TIP,
  CULTURE_PROPORTIONS_TIP,
  CULTURE_TILES_TIP,
  deleteCultureTip,
  duplicateCultureTip,
} from './help/cultureTips';

const SECTION_HEADING_CLASSES = 'mb-1.5 text-[10px] tracking-[0.1em] uppercase text-ink-dim';

export function CultureSheet({ culture }: { culture: Culture }) {
  const { perform } = useAppRuntime();
  return (
    <div className="mb-1.5">
      <input
        type="text"
        aria-label="culture name"
        className={classes(FIELD_CLASSES, 'mb-2 w-full')}
        value={culture.name}
        onChange={(event) =>
          perform('rename_culture', { culture_id: culture.id, name: event.target.value })
        }
        {...tooltipHandlers(CULTURE_NAME_TIP)}
      />
      <CultureActionsRow culture={culture} />
      <CultureSection heading="proportions" tip={CULTURE_PROPORTIONS_TIP}>
        <CultureProportionSliders culture={culture} />
      </CultureSection>
      <CultureSection heading="tiles" tip={CULTURE_TILES_TIP}>
        <CultureTileChoices culture={culture} />
      </CultureSection>
      <CultureSection heading="pieces" tip={CULTURE_PIECES_TIP}>
        <CultureRoleBindings culture={culture} />
      </CultureSection>
    </div>
  );
}

function CultureSection({
  heading,
  tip,
  children,
}: {
  heading: string;
  tip: Parameters<typeof tooltipHandlers>[0];
  children: ReactNode;
}) {
  return (
    <section className="mb-3">
      <h4 className={SECTION_HEADING_CLASSES} {...tooltipHandlers(tip)}>
        {heading}
      </h4>
      {children}
    </section>
  );
}

function CultureActionsRow({ culture }: { culture: Culture }) {
  const { perform } = useAppRuntime();
  const { clear } = useLibrarySelection();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function deleteThisCulture(): void {
    setConfirmingDelete(false);
    perform('remove_culture', { culture_id: culture.id });
    clear();
  }

  return (
    <>
      <div className="mb-3 flex gap-1.5">
        <Button
          className="flex-1"
          tip={duplicateCultureTip(culture)}
          onClick={() => perform('duplicate_culture', { culture_id: culture.id })}
        >
          ⧉ duplicate
        </Button>
        <Button
          className="hover:border-danger-edge hover:text-danger-ink"
          tip={deleteCultureTip(culture)}
          onClick={() => setConfirmingDelete(true)}
        >
          ✕
        </Button>
      </div>
      {confirmingDelete && (
        <ConfirmModal
          {...deleteRowConfirmation(culture.name)}
          onConfirm={deleteThisCulture}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </>
  );
}
