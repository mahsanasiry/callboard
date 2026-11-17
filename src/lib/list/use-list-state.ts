'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useTransition } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { parseListState, serializeListState, type ListConfig, type ListState } from './state';

export function useListState(config: ListConfig) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const state = useMemo(() => parseListState(searchParams, config), [searchParams, config]);

  const navigate = useCallback(
    (next: ListState) => {
      const query = serializeListState(next, config).toString();
      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname);
      });
    },
    [config, pathname, router],
  );

  return { state, navigate, isPending };
}
