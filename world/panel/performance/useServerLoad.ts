import { useEffect, useState } from 'react';
import { fetchServerLoad } from '../../../perf/fetchServerLoad';
import type { ServerLoad } from '../../../perf/serverLoadContract';

const SERVER_POLL_MS = 2000;

export function useServerLoad(): ServerLoad | null {
  const [load, setLoad] = useState<ServerLoad | null>(null);
  useEffect(() => pollServerLoad(setLoad), []);
  return load;
}

function pollServerLoad(onLoad: (load: ServerLoad | null) => void): () => void {
  let stopped = false;
  const poll = async (): Promise<void> => {
    const load = await fetchServerLoad();
    if (!stopped) onLoad(load);
  };
  void poll();
  const timer = window.setInterval(poll, SERVER_POLL_MS);
  return () => {
    stopped = true;
    window.clearInterval(timer);
  };
}
