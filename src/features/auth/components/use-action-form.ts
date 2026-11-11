'use client';

import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import type { ActionResult, FormErrorKey } from '../result';
import { toValidationKey, type ValidationKey } from '../validation';

export function useValidationMessage() {
  const t = useTranslations('Validation');
  return (message: string | undefined): string | undefined => {
    if (message === undefined) return undefined;
    const key: ValidationKey = toValidationKey(message);
    return t(key, { min: 10, max: 72 });
  };
}

export function useActionSubmit<TValues extends FieldValues>(
  setError: UseFormSetError<TValues>,
  initialError: FormErrorKey | null = null,
) {
  const [formError, setFormError] = useState<FormErrorKey | null>(initialError);
  const [isPending, startTransition] = useTransition();

  function submit(run: () => Promise<ActionResult>) {
    setFormError(null);
    startTransition(async () => {
      const result = await run();
      if (result.status !== 'error') return;
      if (result.formError) setFormError(result.formError);
      for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
        if (message === undefined) continue;
        setError(field as Path<TValues>, { type: 'server', message }, { shouldFocus: true });
      }
    });
  }

  return { formError, isPending, submit };
}
