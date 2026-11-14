'use client';

import * as AlertDialog from '@radix-ui/react-alert-dialog';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  pending: boolean;
  onConfirm: () => void;
}

/** For actions that cannot be undone: the person has to confirm in a separate step. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  pending,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
        <AlertDialog.Content className="fixed start-1/2 top-1/2 z-50 flex w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-xl border border-line bg-surface p-6 shadow-overlay rtl:translate-x-1/2">
          <AlertDialog.Title className="font-display text-xl font-semibold">
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description className="text-ink-muted">
            {description}
          </AlertDialog.Description>
          <div className="flex flex-wrap justify-end gap-3">
            <AlertDialog.Cancel className="button-quiet" disabled={pending}>
              {cancelLabel}
            </AlertDialog.Cancel>
            <button
              type="button"
              className="button"
              style={{ background: 'var(--ds-danger)', color: 'var(--ds-surface)' }}
              disabled={pending}
              aria-busy={pending}
              onClick={onConfirm}
            >
              {confirmLabel}
            </button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
