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
  fill,
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
  fill?: boolean;
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
          fill,
          collapsed: layout.isCollapsed(panelKey),
          onToggleCollapsed: () => layout.toggleCollapsed(panelKey),
        }}
      >
        {children}
      </Panel>
      <PanelResizer
        width={layout.widthOf(panelKey)}
        disabled={layout.isCollapsed(panelKey)}
        onResize={(width) => layout.resizePanel(panelKey, width)}
        onResetWidth={() => layout.resetPanelWidth(panelKey)}
      />
    </>
  );
}
