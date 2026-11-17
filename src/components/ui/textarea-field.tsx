import { useId, type ComponentProps } from 'react';

interface TextAreaFieldProps extends Omit<ComponentProps<'textarea'>, 'id'> {
  label: string;
  error?: string | undefined;
}

export function TextAreaField({ label, error, className, ...props }: TextAreaFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="field">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <textarea
        {...props}
        id={id}
        rows={4}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`control w-full py-2 ${className ?? ''}`}
      />
      {error ? (
        <p id={errorId} className="field-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
