import { createRoot } from 'react-dom/client';
import './styles/index.css';
import './procgen/nodes';
import { attachAgentPipelineSync } from './agent/ui/livePipelineSync';
import { App } from './app/App';
import { createAppRuntime } from './app/appRuntime';
import { AppRuntimeProvider } from './app/appRuntimeContext';
import { preloadPersistedFiles } from './persistence/repoFileStore';

void preloadPersistedFiles(['pipeline', 'tileset']).then(startApp);

function startApp(): void {
  const container = document.getElementById('app');
  if (!container) throw new Error('missing #app');
  const runtime = createAppRuntime();
  attachAgentPipelineSync(runtime.store);
  createRoot(container).render(
    <AppRuntimeProvider runtime={runtime}>
      <App />
    </AppRuntimeProvider>,
  );
}
