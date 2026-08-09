import { Icon } from './Icon';

export function LibraryIcon({ size }: { size?: number }) {
  return (
    <Icon size={size}>
      <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4L11 7.5h8.5A1.5 1.5 0 0 1 21 9v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18Z" />
      <path d="M3 10.5h18" />
    </Icon>
  );
}

export function DetailIcon({ size }: { size?: number }) {
  return (
    <Icon size={size}>
      <path d="M4 7.5h16" />
      <path d="M4 12h16" />
      <path d="M4 16.5h16" />
      <circle cx="9" cy="7.5" r="2" />
      <circle cx="15" cy="12" r="2" />
      <circle cx="8" cy="16.5" r="2" />
    </Icon>
  );
}

export function AgentsIcon({ size }: { size?: number }) {
  return (
    <Icon size={size}>
      <rect x="4" y="8" width="16" height="12" rx="3" />
      <path d="M12 3v5" />
      <circle cx="9" cy="13.5" r="1.2" />
      <circle cx="15" cy="13.5" r="1.2" />
      <path d="M9.5 17.5h5" />
    </Icon>
  );
}

export function AgentLogIcon({ size }: { size?: number }) {
  return (
    <Icon size={size}>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <path d="M6.5 9.5 9 12l-2.5 2.5" />
      <path d="M12 15h5.5" />
      <path d="M12 9h3" />
    </Icon>
  );
}

export function WorldIcon({ size }: { size?: number }) {
  return (
    <Icon size={size}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3.5 9.5h17" />
      <path d="M3.5 14.5h17" />
      <path d="M12 3c2.8 3 2.8 15 0 18" />
      <path d="M12 3c-2.8 3-2.8 15 0 18" />
    </Icon>
  );
}

export function WalkIcon({ size }: { size?: number }) {
  return (
    <Icon size={size}>
      <circle cx="13" cy="4" r="2" />
      <path d="M13 6.5 11 12" />
      <path d="M11 12 8.5 15.5 7.5 20" />
      <path d="M11 12 14 14.5 15.5 20" />
      <path d="M11.8 9 15.5 11" />
      <path d="M11.8 9 8.5 11.5" />
    </Icon>
  );
}

export function HelpIcon({ size }: { size?: number }) {
  return (
    <Icon size={size}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.2a2.6 2.6 0 1 1 3.1 2.9v1.6" />
      <path d="M12.6 16.8h.01" />
    </Icon>
  );
}

export function CollapseIcon({ size }: { size?: number }) {
  return (
    <Icon size={size}>
      <path d="M15 5 8 12l7 7" />
      <path d="M19 5v14" />
    </Icon>
  );
}
