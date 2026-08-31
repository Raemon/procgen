import {
  boundRolesSummaryOf,
  proportionsSummaryOf,
} from '@/features/asset-library/cultures/cultureSummary';
import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import { useRerenderOnCultureChange } from '@/features/app-shell/runtime/rerenderHooks';
import { CultureIcon } from '../icons/CultureIcon';
import type { LibraryEntry } from './libraryEntry';

export function useCultureEntries(): LibraryEntry[] {
  const { cultures, perform } = useAppRuntime();
  useRerenderOnCultureChange();
  return cultures.all().map((culture) => ({
    key: String(culture.id),
    name: culture.name,
    icon: <CultureIcon culture={culture} />,
    tip: {
      title: culture.name,
      body: `culture ${culture.id} · ${proportionsSummaryOf(culture)} · ${boundRolesSummaryOf(culture)}`,
    },
    rename: (name: string) => perform('rename_culture', { culture_id: culture.id, name }),
    duplicate: () => perform('duplicate_culture', { culture_id: culture.id }),
    remove: () => perform('remove_culture', { culture_id: culture.id }),
  }));
}
