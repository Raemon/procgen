'use client';

import { useEffect, useState } from 'react';
import { AppRuntimeProvider } from './runtime/appRuntimeContext';
import { createAppRuntime, type AppRuntime } from './runtime/appRuntime';
import { preloadPersistedFiles } from './persistence/repoFileStore';
import { PERSISTED_DOCUMENT_NAMES } from './persistence/persistedDocuments';
import { ProcgenApp } from './ProcgenApp';

let runtimePromise: Promise<AppRuntime> | null = null;

export function ProcgenClient() {
  const [runtime, setRuntime] = useState<AppRuntime | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let connectedRuntime: AppRuntime | null = null;
    void loadRuntime()
      .then((loaded) => {
        if (!mounted) return;
        connectedRuntime = loaded;
        loaded.net.connect();
        setRuntime(loaded);
      })
      .catch((error) => mounted && setFailure(String(error)));
    return () => {
      mounted = false;
      connectedRuntime?.net.disconnect();
    };
  }, []);

  if (failure) return <main className="p-4 text-error-ink">{failure}</main>;
  if (!runtime) return <main className="p-4 text-ink-dim">loading world…</main>;
  return (
    <AppRuntimeProvider runtime={runtime}>
      <ProcgenApp />
    </AppRuntimeProvider>
  );
}

function loadRuntime(): Promise<AppRuntime> {
  runtimePromise ??= preloadPersistedFiles(PERSISTED_DOCUMENT_NAMES).then(createAppRuntime);
  return runtimePromise;
}
