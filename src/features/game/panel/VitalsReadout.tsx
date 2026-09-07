import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import { useRerenderOnFightChange } from '@/features/app-shell/runtime/rerenderHooks';
import { tooltipHandlers } from '@/features/app-shell/tooltips/tooltipHandlers';
import { VIGOR_TIP } from './help/gameTips';

export function VitalsReadout() {
  const { fight } = useAppRuntime();
  useRerenderOnFightChange();
  const left = fight.vigorLeft();
  const vigor = fight.playerVigor();
  return (
    <span
      className={`whitespace-nowrap tabular-nums ${left <= vigor / 3 ? 'text-danger-ink' : 'text-ink-dim'}`}
      {...tooltipHandlers(VIGOR_TIP)}
    >
      ♥ {left}/{vigor}
    </span>
  );
}
