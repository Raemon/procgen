import { createRoot } from 'react-dom/client';
import './styles/index.css';
import '../procgen/nodes';
import { App } from './App';
import { createAppRuntime } from './appRuntime';
import { AppRuntimeProvider } from './appRuntimeContext';
import { playerName } from '../multiplayer/client/playerName';
import { preloadPersistedFiles } from './persistence/repoFileStore';

void preloadPersistedFiles([
  'pipeline',
  'tiles',
  'templates',
  'worldPresets',
  'pieces',
  'creatures',
  'items',
]).then(
  startApp,
);

function startApp(): void {
  const container = document.getElementById('app');
  if (!container) throw new Error('missing #app');
  const runtime = createAppRuntime();
  runtime.net.connect(playerName());
  createRoot(container).render(
    <AppRuntimeProvider runtime={runtime}>
      <App />
    </AppRuntimeProvider>,
  );
}
