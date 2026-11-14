export function initialsOf(name: string, fallback: string): string {
  const source = name.trim() || fallback;
  const parts = source.split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? [parts[0], parts[parts.length - 1]] : [parts[0]];
  return letters
    .map((part) => (part ? Array.from(part)[0] : ''))
    .join('')
    .toUpperCase();
}

interface AvatarProps {
  name: string;
  fallback?: string;
  className?: string;
}

/** Decorative initials: the person's name is always written next to it. */
export function Avatar({ name, fallback = '?', className = 'size-10 text-sm' }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full border border-line-strong bg-accent-soft font-semibold text-ink ${className}`}
    >
      {initialsOf(name, fallback)}
    </span>
  );
}
