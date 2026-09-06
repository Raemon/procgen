import type { ReactElement } from 'react';
import { Icon } from '@/features/app-shell/icons/Icon';
import { WalkIcon } from '@/features/app-shell/icons/panelIcons';
import type { ViewMode } from './viewMode';

function VoxelGodIcon({ size }: { size?: number }) {
  return (
    <Icon size={size}>
      <path d="M12 3 21 8v8l-9 5-9-5V8Z" />
      <path d="M3 8l9 5 9-5" />
      <path d="M12 13v8" />
    </Icon>
  );
}

function AgentGodIcon({ size }: { size?: number }) {
  return (
    <Icon size={size}>
      <path d="M12 3 21 8v8l-9 5-9-5V8Z" />
      <path d="M8.5 9.5 6.5 12l2 2.5" />
      <path d="M15.5 9.5 17.5 12l-2 2.5" />
      <path d="M13 8.5 11 15.5" />
    </Icon>
  );
}

function AgentCharacterIcon({ size }: { size?: number }) {
  return (
    <Icon size={size}>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <circle cx="12" cy="8.5" r="1.6" />
      <path d="M12 10.5v4" />
      <path d="M12 14.5 10 17.5" />
      <path d="M12 14.5 14 17.5" />
      <path d="M9.5 12h5" />
    </Icon>
  );
}

function TopDownIcon({ size }: { size?: number }) {
  return (
    <Icon size={size}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="1.5" />
      <circle cx="12" cy="12" r="2" />
      <path d="M3.5 8.5h5v12h-5Z" />
      <path d="M15.5 3.5h5v6h-5Z" />
    </Icon>
  );
}

function AgentTopDownIcon({ size }: { size?: number }) {
  return (
    <Icon size={size}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="1.5" />
      <path d="M8 8.5 6 12l2 3.5" />
      <path d="M16 8.5 18 12l-2 3.5" />
      <path d="M13.2 7.5 10.8 16.5" />
    </Icon>
  );
}

function FeatureMapIcon({ size }: { size?: number }) {
  return (
    <Icon size={size}>
      <path d="M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20Z" />
      <circle cx="8" cy="9" r="1.6" />
      <circle cx="16" cy="14" r="1.6" />
      <path d="M9.4 10.1 14.6 12.9" />
    </Icon>
  );
}

export const VIEW_MODE_ICONS: Readonly<
  Record<ViewMode, (props: { size?: number }) => ReactElement>
> = {
  '3d-god': VoxelGodIcon,
  'agent-god': AgentGodIcon,
  'top-down': TopDownIcon,
  'agent-top-down': AgentTopDownIcon,
  character: WalkIcon,
  'agent-character': AgentCharacterIcon,
  features: FeatureMapIcon,
};
