'use client';

import { useEffect, useState } from 'react';
import { AppRuntimeProvider } from './runtime/appRuntimeContext';
import { createAppRuntime, type AppRuntime } from './runtime/appRuntime';
import { preloadPersistedDocuments } from './persistence/persistedDocumentStore';
import { PERSISTED_DOCUMENT_NAMES } from './persistence/persistedDocuments';
import { ProcgenApp } from './ProcgenApp';

let runtimePromise: Promise<AppRuntime> | null = null;

export function ProcgenClient() {
  const [runtime, setRuntime] = useState<AppRuntime | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

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
  }, [loadAttempt]);

  if (failure) {
    return (
      <main className="flex h-full items-center justify-center p-4">
        <div className="max-w-lg text-center">
          <p className="text-error-ink">{failure}</p>
          <button
            className="mt-3 rounded border border-line px-3 py-1 text-ink"
            onClick={() => {
              setFailure(null);
              setLoadAttempt((attempt) => attempt + 1);
            }}
          >
            retry loading
          </button>
        </div>
      </main>
    );
  }
  if (!runtime) return <main className="p-4 text-ink-dim">loading world…</main>;
  return (
    <AppRuntimeProvider runtime={runtime}>
      <ProcgenApp />
    </AppRuntimeProvider>
  );
}

function loadRuntime(): Promise<AppRuntime> {
  runtimePromise ??= preloadPersistedDocuments(PERSISTED_DOCUMENT_NAMES)
    .then(createAppRuntime)
    .catch((error) => {
      runtimePromise = null;
      throw error;
    });
  return runtimePromise;
}
