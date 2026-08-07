import { useMemo } from 'react';
import { isStringArray } from './persistedUiGuards';
import { toggledMembers } from './toggledMembers';
import { usePersistedUiValue } from './usePersistedUiValue';

export interface PersistedUiSet {
  has(member: string): boolean;
  toggle(member: string): void;
}

const NO_MEMBERS: string[] = [];

export function usePersistedUiSet(key: string): PersistedUiSet {
  const [members, setMembers] = usePersistedUiValue<string[]>(key, NO_MEMBERS, isStringArray);
  const set = useMemo(() => new Set(members), [members]);
  return {
    has: (member) => set.has(member),
    toggle: (member) => setMembers(toggledMembers(members, member)),
  };
}
