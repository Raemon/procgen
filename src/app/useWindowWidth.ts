import { useSyncExternalStore } from 'react';

export function useWindowWidth(): number {
  return useSyncExternalStore(subscribeToWindowResize, readWindowWidth);
}

function subscribeToWindowResize(onResize: () => void): () => void {
  window.addEventListener('resize', onResize);
  return () => window.removeEventListener('resize', onResize);
}

function readWindowWidth(): number {
  return window.innerWidth;
}
