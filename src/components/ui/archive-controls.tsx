'use client';

import { useState, useTransition } from 'react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { FormError } from '@/features/auth/components/form-error';
import type { ActionResult, FormErrorKey } from '@/features/auth/result';

export interface ArchiveLabels {
  button: string;
  dialogTitle: string;
  dialogBody: string;
  confirm: string;
  working: string;
  cancel: string;
  isArchived: string;
  restore: string;
  restoring: string;
}

interface ArchiveControlsProps {
  archived: boolean;
  canArchive: boolean;
  canRestore: boolean;
  labels: ArchiveLabels;
  onArchive: () => Promise<ActionResult>;
  onRestore: () => Promise<ActionResult>;
}

/** Archiving hides a record without destroying it; it asks first and can be undone. */
export function ArchiveControls({
  archived,
  canArchive,
  canRestore,
  labels,
  onArchive,
  onRestore,
}: ArchiveControlsProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<FormErrorKey | null>(null);
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<ActionResult>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.status === 'error') setError(result.formError ?? 'generic');
      setOpen(false);
    });
  }

  if (archived) {
    return (
      <div className="flex flex-col gap-3">
        <p className="notice">{labels.isArchived}</p>
        <FormError error={error} />
        {canRestore ? (
          <button
            type="button"
            className="button-quiet self-start"
            disabled={isPending}
            onClick={() => {
              run(onRestore);
            }}
          >
            {isPending ? labels.restoring : labels.restore}
          </button>
        ) : null}
      </div>
    );
  }

  if (!canArchive) return null;

  return (
    <div className="flex flex-col gap-3">
      <FormError error={error} />
      <button
        type="button"
        className="button-quiet self-start"
        style={{ borderColor: 'var(--ds-danger)', color: 'var(--ds-danger)' }}
        onClick={() => {
          setOpen(true);
        }}
      >
        {labels.button}
      </button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={labels.dialogTitle}
        description={labels.dialogBody}
        confirmLabel={isPending ? labels.working : labels.confirm}
        cancelLabel={labels.cancel}
        pending={isPending}
        onConfirm={() => {
          run(onArchive);
        }}
      />
    </div>
  );
}
