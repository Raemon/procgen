import { Icon } from './Icon';

export function DuplicateIcon({ size }: { size?: number }) {
  return (
    <Icon size={size}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M15 5.5A1.5 1.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A1.5 1.5 0 0 0 5.5 15" />
    </Icon>
  );
}

export function InsertIcon({ size }: { size?: number }) {
  return (
    <Icon size={size}>
      <path d="M12 4v9" />
      <path d="M8.5 9.5L12 13l3.5-3.5" />
      <path d="M4.5 15.5V18A1.5 1.5 0 0 0 6 19.5h12a1.5 1.5 0 0 0 1.5-1.5v-2.5" />
    </Icon>
  );
}

export function RunIcon({ size }: { size?: number }) {
  return (
    <Icon size={size}>
      <path d="M8 5.5l10 6.5-10 6.5z" />
    </Icon>
  );
}

export function TrashIcon({ size }: { size?: number }) {
  return (
    <Icon size={size}>
      <path d="M4 7h16" />
      <path d="M9.5 7V4.5h5V7" />
      <path d="M6.5 7l1 12.5h9L17.5 7" />
      <path d="M10.5 10.5v6" />
      <path d="M13.5 10.5v6" />
    </Icon>
  );
}

export function FolderIcon({ size }: { size?: number }) {
  return (
    <Icon size={size}>
      <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4L11 7.5h8.5A1.5 1.5 0 0 1 21 9v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18Z" />
    </Icon>
  );
}
