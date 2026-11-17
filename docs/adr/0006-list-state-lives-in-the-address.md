# 0006. List state lives in the address, pages are offset-based

Status: accepted

## Context

Lists in a planning tool are shared constantly: "look at the camera items in maintenance" has to survive a refresh, the Back button and a message to a colleague. They also have to stay fast when an organisation holds thousands of rows.

## Decision

Search text, filters, sort order, page and page size are all query parameters. `src/lib/list/state.ts` is the only code that reads or writes them. It is pure: it turns an address into a validated state (anything unknown falls back to a default, so a hand-edited or stale link never errors) and a state back into the shortest address, leaving defaults out. Changing the results, such as the search text, a filter or the sort, returns to page one.

The page is a server component. It parses the address, asks Supabase for exactly one page (`range`, `order`, `ilike`, `in`, and an exact `count`), and hands the rows to a client component that renders the table and the controls. The client never holds a copy of the full list.

Pagination is offset based. The two alternatives were keyset (cursor) pagination and infinite scroll. Keyset is faster on very deep pages, but it cannot jump to page 7, cannot show "page 7 of 12", and needs a unique sort key for every sortable column. These lists are bounded by how many items one organisation owns, rows are sorted by arbitrary columns, and deep pages are rare, so numbered pages with a stable tie-break (`name`, then `id`) are the better fit.

Search is `ilike` on indexed columns. Characters that mean something in a PostgREST filter or a LIKE pattern are stripped from the search text before it reaches the query.

## Consequences

Every list gets URL state, validation and paging by supplying a small config. A page that was deleted from under you shows the empty state rather than an error. Page size is limited to a fixed set, so a crafted link cannot ask for a million rows.

Row virtualisation is not used yet: pages hold at most 100 rows. It will be added with the schedule, where a single day can hold far more cells than one page of a table.
