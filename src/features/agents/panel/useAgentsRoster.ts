import { useCallback, useEffect, useState } from 'react';
import { fetchAgents, type RosterAgent } from './agentsApiClient';

const ROSTER_POLL_MS = 2000;

export function useAgentsRoster(): { agents: RosterAgent[]; refresh: () => void } {
  const [agents, setAgents] = useState<RosterAgent[]>([]);
  const refresh = useCallback(() => {
    void fetchAgents().then(setAgents);
  }, []);
  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, ROSTER_POLL_MS);
    return () => clearInterval(timer);
  }, [refresh]);
  return { agents, refresh };
}
