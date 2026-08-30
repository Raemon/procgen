import type { ReactNode } from 'react';
import type { TooltipContent } from '../tooltips/tooltipContent';
import { Panel } from './Panel';
import { PanelResizer } from './PanelResizer';
import type { PanelKey, PanelLayout } from './usePanelLayout';

export function PanelColumn({
  panelKey,
  title,
  tip,
  icon,
  tone,
  rail,
  headerActions,
  layout,
  children,
}: {
  panelKey: PanelKey;
  title: string;
  tip: TooltipContent;
  icon: ReactNode;
  tone: string;
  rail: ReactNode;
  headerActions?: ReactNode;
  layout: PanelLayout;
  children: ReactNode;
}) {
  return (
    <>
      <Panel
        chrome={{
          title,
          tip,
          icon,
          tone,
          rail,
          headerActions,
          collapsed: layout.isCollapsed(panelKey),
          onToggleCollapsed: () => layout.toggleCollapsed(panelKey),
        }}
      >
        {children}
      </Panel>
      <PanelResizer
        width={layout.widthOf(panelKey)}
        disabled={layout.isCollapsed(panelKey) || layout.stretchesIntoFoldedWorld(panelKey)}
        onResize={(width) => layout.resizePanel(panelKey, width)}
        onResetWidth={() => layout.resetPanelWidth(panelKey)}
      />
    </>
  );
}
