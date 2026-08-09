import { createRoot } from 'react-dom/client';
import './styles/index.css';
import '../procgen/nodes';
import { App } from './App';
import { createAppRuntime } from './appRuntime';
import { AppRuntimeProvider } from './appRuntimeContext';
import { PERSISTED_DOC_NAMES } from '../server/persistence/docsRepo';
import { preloadPersistedFiles } from './persistence/repoFileStore';

void preloadPersistedFiles(PERSISTED_DOC_NAMES).then(startApp);

function startApp(): void {
  const container = document.getElementById('app');
  if (!container) throw new Error('missing #app');
  const runtime = createAppRuntime();
  runtime.net.connect();
  createRoot(container).render(
    <AppRuntimeProvider runtime={runtime}>
      <App />
    </AppRuntimeProvider>,
  );
}
