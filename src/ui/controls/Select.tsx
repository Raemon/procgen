import { classes } from './classes';

const SELECT_CLASSES =
  'min-w-0 cursor-pointer rounded border bg-field px-1.5 py-1 text-xs text-ink';

export interface SelectOption {
  value: string;
  text: string;
}

export function Select({
  options,
  value,
  onChange,
  className,
  title,
  fullWidth = true,
  warn = false,
}: {
  options: readonly SelectOption[];
  value: string;
  onChange(value: string): void;
  className?: string;
  title?: string;
  fullWidth?: boolean;
  warn?: boolean;
}) {
  return (
    <select
      className={classes(
        SELECT_CLASSES,
        warn ? 'border-warn-edge' : 'border-panel-edge',
        fullWidth ? 'w-full' : 'w-auto',
        className,
      )}
      value={value}
      title={title}
      onChange={(event) => onChange(event.target.value)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.text}
        </option>
      ))}
    </select>
  );
}
