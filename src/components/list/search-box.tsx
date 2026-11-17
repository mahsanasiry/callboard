'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

interface SearchBoxProps {
  value: string;
  onSearch: (value: string) => void;
  maxLength: number;
}

const DEBOUNCE_MS = 300;

export function SearchBox({ value, onSearch, maxLength }: SearchBoxProps) {
  const t = useTranslations('List');
  const [text, setText] = useState(value);
  const [seen, setSeen] = useState(value);
  const [submitted, setSubmitted] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Back/Forward or a shared link changes the address; the box follows it,
  // unless the address is only catching up with what was just typed.
  if (value !== seen) {
    setSeen(value);
    if (value !== submitted) setText(value);
  }

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function schedule(next: string) {
    setText(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const trimmed = next.trim();
      if (trimmed !== value) {
        setSubmitted(trimmed);
        onSearch(trimmed);
      }
    }, DEBOUNCE_MS);
  }

  return (
    <label className="relative block min-w-0 flex-1 sm:max-w-sm">
      <span className="sr-only">{t('search')}</span>
      <svg
        viewBox="0 0 24 24"
        className="pointer-events-none absolute inset-y-0 start-3 my-auto size-5 text-ink-subtle"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        type="search"
        value={text}
        maxLength={maxLength}
        placeholder={t('search')}
        autoComplete="off"
        onChange={(event) => {
          schedule(event.target.value);
        }}
        className="control w-full ps-10"
      />
    </label>
  );
}
