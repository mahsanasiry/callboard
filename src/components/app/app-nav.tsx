'use client';

import { Link, usePathname } from '@/i18n/navigation';

type NavHref = '/dashboard' | '/members' | '/settings';

interface AppNavProps {
  label: string;
  items: readonly { href: NavHref; label: string }[];
}

const ICONS: Record<NavHref, React.ReactNode> = {
  '/dashboard': (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </>
  ),
  '/members': (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.6-3.4 3.2-5 6.5-5s5.9 1.6 6.5 5" />
      <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 15.3c2 .6 3.2 2 3.5 4.7" />
    </>
  ),
  '/settings': (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </>
  ),
};

function Icon({ href }: { href: NavHref }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[href]}
    </svg>
  );
}

function useCurrent() {
  const pathname = usePathname();
  return (href: NavHref) => pathname === href || pathname.startsWith(`${href}/`);
}

/** Top navigation for wide screens. */
export function AppNav({ label, items }: AppNavProps) {
  const isCurrent = useCurrent();

  return (
    <nav aria-label={label} className="hidden sm:block">
      <ul className="flex items-center gap-1">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={isCurrent(item.href) ? 'page' : undefined}
              className={`inline-flex min-h-10 items-center rounded-md px-3 text-sm no-underline ${
                isCurrent(item.href)
                  ? 'bg-accent-soft font-medium'
                  : 'text-ink-muted hover:bg-raised hover:text-ink'
              }`}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * Bottom navigation for phones, within thumb reach. It is rendered outside the
 * header on purpose: a blurred header would become the containing block of a
 * fixed element and trap it.
 */
export function AppBottomNav({ label, items }: AppNavProps) {
  const isCurrent = useCurrent();

  return (
    <nav
      aria-label={label}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-canvas/95 backdrop-blur sm:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <ul
        className="grid"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={isCurrent(item.href) ? 'page' : undefined}
              className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs no-underline ${
                isCurrent(item.href) ? 'font-semibold text-accent' : 'text-ink-muted'
              }`}
            >
              <Icon href={item.href} />
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
