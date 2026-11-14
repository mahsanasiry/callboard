import { useId, type ComponentProps } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps extends Omit<ComponentProps<'select'>, 'id' | 'children'> {
  label: string;
  options: readonly SelectOption[];
  error?: string | undefined;
}

export function SelectField({
  label,
  options,
  error,
  className,
  ...selectProps
}: SelectFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="field">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <select
        {...selectProps}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`control w-full ${className ?? ''}`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <p id={errorId} className="field-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
