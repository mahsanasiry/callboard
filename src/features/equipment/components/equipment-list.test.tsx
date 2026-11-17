import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import messages from '../../../../messages/en.json';
import type { EquipmentRow } from '../queries';

const replace = vi.fn();
let currentQuery = '';

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(currentQuery),
}));

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => '/equipment',
  Link: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const { EquipmentList } = await import('./equipment-list');

const departments = [
  { id: 'd-camera', name: 'Camera' },
  { id: 'd-sound', name: 'Sound' },
];

function row(index: number, overrides: Partial<EquipmentRow> = {}): EquipmentRow {
  return {
    id: `id-${index}`,
    name: `Item ${index}`,
    category: 'camera',
    status: 'available',
    asset_tag: `TAG-${index}`,
    department_id: 'd-camera',
    notes: '',
    updated_at: '2026-11-02T10:00:00Z',
    deleted_at: null,
    ...overrides,
  };
}

function renderList(props: { rows?: EquipmentRow[]; total?: number } = {}) {
  const rows = props.rows ?? [row(1), row(2)];
  return render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <EquipmentList
        rows={rows}
        total={props.total ?? rows.length}
        departments={departments}
        canSeeArchive
      />
    </NextIntlClientProvider>,
  );
}

beforeAll(() => {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => undefined;
  Element.prototype.releasePointerCapture = () => undefined;
  Element.prototype.scrollIntoView = () => undefined;
});

beforeEach(() => {
  replace.mockReset();
  currentQuery = '';
});

afterEach(() => {
  vi.useRealTimers();
});

describe('EquipmentList', () => {
  it('shows each item with its category, department and status', () => {
    renderList();
    const table = screen.getByRole('table');
    expect(within(table).getByRole('link', { name: 'Item 1' })).toHaveAttribute(
      'href',
      '/equipment/id-1',
    );
    expect(within(table).getAllByText('Camera').length).toBeGreaterThan(0);
    expect(within(table).getAllByText('Available')).toHaveLength(2);
  });

  it('tells screen readers which column is sorted', () => {
    currentQuery = 'sort=status.desc';
    renderList();
    expect(screen.getByRole('columnheader', { name: /Status/ })).toHaveAttribute(
      'aria-sort',
      'descending',
    );
    expect(screen.getByRole('columnheader', { name: /Name/ })).toHaveAttribute('aria-sort', 'none');
  });

  it('puts the new sort in the address, back on the first page', async () => {
    currentQuery = 'page=3';
    const user = userEvent.setup();
    renderList({ total: 200 });

    await user.click(screen.getByRole('button', { name: 'Sort by Category' }));

    expect(replace).toHaveBeenCalledWith('/equipment?sort=category.asc');
  });

  it('reverses the sort when the same column is chosen again', async () => {
    currentQuery = 'sort=category.asc';
    const user = userEvent.setup();
    renderList();

    await user.click(screen.getByRole('button', { name: 'Sort by Category' }));

    expect(replace).toHaveBeenCalledWith('/equipment?sort=category.desc');
  });

  it('adds a filter to the address when it is ticked', async () => {
    const user = userEvent.setup();
    renderList();

    await user.click(screen.getByRole('button', { name: 'Status' }));
    await user.click(await screen.findByRole('checkbox', { name: 'In maintenance' }));

    expect(replace).toHaveBeenCalledWith('/equipment?status=maintenance');
  });

  it('shows active filters as chips that can be removed one by one', async () => {
    currentQuery = 'status=maintenance&category=camera';
    const user = userEvent.setup();
    renderList();

    const chips = screen.getByRole('list', { name: 'Active filters' });
    expect(within(chips).getByText('In maintenance')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Remove filter Status: In maintenance' }));
    expect(replace).toHaveBeenCalledWith('/equipment?category=camera');
  });

  it('clears the search and every filter at once', async () => {
    currentQuery = 'q=lens&status=retired&page=2';
    const user = userEvent.setup();
    renderList();

    await user.click(screen.getByRole('button', { name: 'Clear all' }));

    expect(replace).toHaveBeenCalledWith('/equipment');
  });

  it('waits for a pause in typing before searching', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
    renderList();

    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'lens');
    expect(replace).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith('/equipment?q=lens');
  });

  it('reads search text from the address, so a shared link looks the same', () => {
    currentQuery = 'q=boom';
    renderList();
    expect(screen.getByRole('searchbox', { name: 'Search' })).toHaveValue('boom');
  });

  it('says what range is showing and pages forward', async () => {
    currentQuery = 'page=2';
    const user = userEvent.setup();
    renderList({ rows: [row(26)], total: 60 });

    expect(screen.getByRole('status')).toHaveTextContent('26–50 of 60');
    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(replace).toHaveBeenCalledWith('/equipment?page=3');
  });

  it('disables the first and last page buttons at the ends', () => {
    renderList({ total: 2 });
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('offers a way out when filters hide everything', async () => {
    currentQuery = 'status=retired';
    const user = userEvent.setup();
    renderList({ rows: [], total: 0 });

    expect(screen.getByText('Nothing matches your search and filters.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Clear search and filters' }));
    expect(replace).toHaveBeenCalledWith('/equipment');
  });

  it('explains an empty organisation instead of showing a bare table', () => {
    renderList({ rows: [], total: 0 });
    expect(screen.getByText('No equipment yet')).toBeInTheDocument();
  });
});
