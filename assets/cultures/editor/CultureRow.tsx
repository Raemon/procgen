import { useAppRuntime } from '../../../frontend/appRuntimeContext';
import { Button } from '../../../frontend/controls/Button';
import { classes } from '../../../frontend/controls/classes';
import { FIELD_CLASSES, HINT_CLASSES } from '../../../frontend/controls/fieldClasses';
import { REVEALED_ON_ROW_HOVER, ROW_HOVER_GROUP } from '../../../frontend/controls/revealOnRowHover';
import { tooltipHandlers } from '../../../frontend/tooltips/tooltipHandlers';
import { isOneOf } from '../../../frontend/uiState/persistedUiGuards';
import { PERSISTED_UI_KEYS } from '../../../frontend/uiState/persistedUiKeys';
import { usePersistedUiRecord } from '../../../frontend/uiState/usePersistedUiRecord';
import type { Culture } from '../cultureDef';
import { boundRolesSummaryOf, proportionsSummaryOf } from '../cultureSummary';
import { CULTURE_DRAWERS, CULTURE_PANELS, type CulturePanel } from './cultureDrawers';
import { CultureProportionSliders } from './CultureProportionSliders';
import { CultureRoleBindings } from './CultureRoleBindings';
import { CultureTileChoices } from './CultureTileChoices';
import { CULTURE_NAME_TIP, deleteCultureTip } from './help/cultureTips';

export function CultureRow({ culture }: { culture: Culture }) {
  const { perform } = useAppRuntime();
  const openPanels = usePersistedUiRecord(
    PERSISTED_UI_KEYS.openCulturePanels,
    isOneOf(CULTURE_PANELS),
  );
  const openPanel = openPanels.valueOf(String(culture.id)) ?? 'none';
  const toggle = (panel: Exclude<CulturePanel, 'none'>) =>
    openPanels.set(String(culture.id), openPanel === panel ? 'none' : panel);
  return (
    <div className="mb-1.5">
      <div className={classes(ROW_HOVER_GROUP, 'flex items-center gap-1.5')}>
        <input
          type="text"
          aria-label="culture name"
          className={classes(FIELD_CLASSES, 'min-w-0 flex-1')}
          value={culture.name}
          onChange={(event) =>
            perform('rename_culture', { culture_id: culture.id, name: event.target.value })
          }
          {...tooltipHandlers(CULTURE_NAME_TIP)}
        />
        {CULTURE_DRAWERS.map((drawer) => (
          <Button
            key={drawer.panel}
            className="px-2 py-0.5 text-[11px]"
            tip={drawer.tip}
            active={openPanel === drawer.panel}
            onClick={() => toggle(drawer.panel)}
          >
            {drawer.label}
          </Button>
        ))}
        <Button
          className={classes(
            REVEALED_ON_ROW_HOVER,
            'px-2 py-0.5 hover:border-danger-edge hover:text-danger-ink',
          )}
          tip={deleteCultureTip(culture)}
          onClick={() => perform('remove_culture', { culture_id: culture.id })}
        >
          ×
        </Button>
      </div>
      <p className={classes(HINT_CLASSES, 'mt-0.5')}>
        {proportionsSummaryOf(culture)} · {boundRolesSummaryOf(culture)}
      </p>
      {openPanel === 'tiles' && <CultureTileChoices culture={culture} />}
      {openPanel === 'proportions' && <CultureProportionSliders culture={culture} />}
      {openPanel === 'pieces' && <CultureRoleBindings culture={culture} />}
    </div>
  );
}
