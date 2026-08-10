import type { ReactNode } from 'react';

export const ASSET_ICON_PX = 32;

export const ASSET_ICON_STYLE = { width: ASSET_ICON_PX, height: ASSET_ICON_PX } as const;

export function AssetIconFrame({ tint, children }: { tint?: string; children: ReactNode }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-sm border border-panel-edge bg-field"
      style={{ ...ASSET_ICON_STYLE, color: tint }}
    >
      {children}
    </span>
  );
}
