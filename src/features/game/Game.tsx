import { GamePanel } from './panel/GamePanel';
import type { PanelLayout } from '@/features/app-shell/layout/usePanelLayout';
import { WorldsPanel } from './worlds/WorldsPanel';

export function Game({ layout }: { layout: PanelLayout }) {
  return (
    <div className="contents">
      <WorldsPanel layout={layout} />
      <GamePanel layout={layout} />
    </div>
  );
}
