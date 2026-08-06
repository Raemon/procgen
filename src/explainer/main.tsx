import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../styles/index.css';
import { ExplainerPage } from './ExplainerPage';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ExplainerPage />
  </StrictMode>,
);
