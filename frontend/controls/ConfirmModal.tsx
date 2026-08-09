import { createPortal } from 'react-dom';
import { Button } from './Button';
import { useEscapeToDismiss } from './useEscapeToDismiss';

export function ConfirmModal({
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm(): void;
  onCancel(): void;
}) {
  useEscapeToDismiss(onCancel);
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onCancel}
    >
      <div
        className="w-72 rounded border border-panel-edge bg-panel p-3 shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="mb-1 text-sm text-ink">{title}</h3>
        <p className="mb-3 text-xs leading-relaxed text-ink">{body}</p>
        <div className="flex justify-end gap-1.5">
          <Button tip={{ title: 'keep it', body: 'Closes this without changing anything.' }} onClick={onCancel}>
            cancel
          </Button>
          <Button
            className="hover:border-danger-edge hover:text-danger-ink"
            tip={{ title: confirmLabel, body: 'There is no undo for this one.' }}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
