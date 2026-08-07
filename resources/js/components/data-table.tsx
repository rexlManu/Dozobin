import {
    CaretDown,
    CaretLeft,
    CaretRight,
    CaretUp,
    CaretUpDown,
} from '@phosphor-icons/react';
import { flexRender } from '@tanstack/react-table';
import type {
    Row,
    RowData,
    Table as TableInstance,
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

declare module '@tanstack/react-table' {
    // Lets a column carry its own responsive/alignment classes.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface ColumnMeta<TData extends RowData, TValue> {
        className?: string;
    }
}

/**
 * Chrome only. Each route owns its own `useReactTable` call next to its columns,
 * because the columns are where the domain lives; what repeats between tables is
 * the frame, the sortable head, the selection takeover and the pager.
 *
 * Deliberately not built on `ui/table.tsx` — its shadcn defaults (text-sm, p-2)
 * fight this type scale, and the row treatment here matches the Library exactly.
 */
export function DataTable<T>({
    table,
    toolbar,
    selectionBar,
    empty,
    grid,
    card,
    unit = 'row',
}: {
    table: TableInstance<T>;
    toolbar?: React.ReactNode;
    /** Actions shown once rows are selected. Replaces the column heads. */
    selectionBar?: React.ReactNode;
    empty: React.ReactNode;
    /**
     * An alternative body for the same rows. The table stays the model — every
     * filter, sort and page still applies — and only the drawing changes, so
     * switching views cannot show you a different set of shares than the columns
     * would have.
     */
    grid?: React.ReactNode;
    /** How one row draws below `md`, where a wide table cannot be read. */
    card?: (row: Row<T>) => React.ReactNode;
    /** Names a row in the count, e.g. "3 users". */
    unit?: string;
}) {
    const rows = table.getRowModel().rows;
    const selected = table.getSelectedRowModel().rows.length;
    const pages = table.getPageCount();
    const { pageIndex, pageSize } = table.getState().pagination;
    const total = table.getFilteredRowModel().rows.length;
    const firstOnPage = total === 0 ? 0 : pageIndex * pageSize + 1;
    const lastOnPage = Math.min(total, (pageIndex + 1) * pageSize);

    /*
    The head row of a bodyless layout. A column-head strip means nothing to a
    stack of cards or a grid of tiles, but select-all and the bulk actions still
    have to live somewhere, so they get their own band.
  */
    const strip = (
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-3 py-2.5 sm:px-4">
            <Checkbox
                aria-label="Select everything on this page"
                checked={table.getIsAllPageRowsSelected()}
                onCheckedChange={(v) =>
                    table.toggleAllPageRowsSelected(v === true)
                }
            />
            {selected > 0 && selectionBar ? (
                <>
                    <span className="text-[12.5px] font-medium">
                        {selected} selected
                    </span>
                    <div className="ml-auto flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => table.resetRowSelection()}
                        >
                            Clear
                        </Button>
                        {selectionBar}
                    </div>
                </>
            ) : (
                <span className="label-mono">
                    {total} {total === 1 ? unit : `${unit}s`}
                </span>
            )}
        </div>
    );

    return (
        <div className="flex flex-col gap-3">
            {toolbar}

            <div className="overflow-hidden rounded-xl border border-border bg-card">
                {grid ? (
                    <>
                        {strip}
                        {rows.length > 0 && (
                            <div className="p-3 sm:p-4">{grid}</div>
                        )}
                    </>
                ) : (
                    <>
                        {/*
          A phone cannot read a nine-column table; it can only scroll one
          sideways, and the columns worth acting on are the ones off-screen.
          So below `md` the same rows redraw as cards. Same table instance, same
          filters, same page — only the shape of a row changes.
        */}
                        {card && (
                            <div className="md:hidden">
                                {strip}
                                <ul className="divide-y divide-border">
                                    {rows.map((row) => (
                                        <li
                                            key={row.id}
                                            className={cn(
                                                'px-3 py-3',
                                                row.getIsSelected() &&
                                                    'bg-primary-soft/40',
                                            )}
                                        >
                                            {card(row)}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <div
                            className={cn(
                                'scrollbar-slim overflow-x-auto',
                                card && 'hidden md:block',
                            )}
                        >
                            <table className="w-full border-collapse text-left">
                                <thead>
                                    {selected > 0 && selectionBar ? (
                                        <tr className="border-b border-border">
                                            <th
                                                colSpan={
                                                    table.getAllLeafColumns()
                                                        .length
                                                }
                                                className="px-3 py-2.5 sm:px-4"
                                            >
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <span className="text-[12.5px] font-medium">
                                                        {selected} selected
                                                    </span>
                                                    <div className="ml-auto flex items-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                table.resetRowSelection()
                                                            }
                                                        >
                                                            Clear
                                                        </Button>
                                                        {selectionBar}
                                                    </div>
                                                </div>
                                            </th>
                                        </tr>
                                    ) : (
                                        table.getHeaderGroups().map((group) => (
                                            <tr
                                                key={group.id}
                                                className="border-b border-border"
                                            >
                                                {group.headers.map((header) => {
                                                    const sortable =
                                                        header.column.getCanSort();
                                                    const sorted =
                                                        header.column.getIsSorted();

                                                    return (
                                                        <th
                                                            key={header.id}
                                                            scope="col"
                                                            className={cn(
                                                                'label-mono px-3 py-2.5 font-normal whitespace-nowrap sm:px-4',
                                                                header.column
                                                                    .columnDef
                                                                    .meta
                                                                    ?.className,
                                                            )}
                                                        >
                                                            {header.isPlaceholder ? null : sortable ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={header.column.getToggleSortingHandler()}
                                                                    className="label-mono inline-flex items-center gap-1 transition-colors hover:text-foreground"
                                                                >
                                                                    {flexRender(
                                                                        header
                                                                            .column
                                                                            .columnDef
                                                                            .header,
                                                                        header.getContext(),
                                                                    )}
                                                                    {sorted ===
                                                                    'asc' ? (
                                                                        <CaretUp
                                                                            weight="bold"
                                                                            className="size-3 text-foreground"
                                                                        />
                                                                    ) : sorted ===
                                                                      'desc' ? (
                                                                        <CaretDown
                                                                            weight="bold"
                                                                            className="size-3 text-foreground"
                                                                        />
                                                                    ) : (
                                                                        <CaretUpDown className="size-3 opacity-40" />
                                                                    )}
                                                                </button>
                                                            ) : (
                                                                flexRender(
                                                                    header
                                                                        .column
                                                                        .columnDef
                                                                        .header,
                                                                    header.getContext(),
                                                                )
                                                            )}
                                                        </th>
                                                    );
                                                })}
                                            </tr>
                                        ))
                                    )}
                                </thead>

                                <tbody className="divide-y divide-border">
                                    {rows.map((row) => (
                                        <tr
                                            key={row.id}
                                            data-state={
                                                row.getIsSelected()
                                                    ? 'selected'
                                                    : undefined
                                            }
                                            className={cn(
                                                'transition-colors',
                                                row.getIsSelected()
                                                    ? 'bg-primary-soft/40'
                                                    : 'hover:bg-muted/50',
                                            )}
                                        >
                                            {row
                                                .getVisibleCells()
                                                .map((cell) => (
                                                    <td
                                                        key={cell.id}
                                                        className={cn(
                                                            'px-3 py-2.5 align-middle sm:px-4',
                                                            cell.column
                                                                .columnDef.meta
                                                                ?.className,
                                                        )}
                                                    >
                                                        {flexRender(
                                                            cell.column
                                                                .columnDef.cell,
                                                            cell.getContext(),
                                                        )}
                                                    </td>
                                                ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {rows.length === 0 && (
                    <div className="px-6 py-14 text-center">{empty}</div>
                )}

                {/* A pager for one page is furniture, so it only appears when it works. */}
                {pages > 1 && (
                    <div className="flex items-center gap-3 border-t border-border px-3 py-2.5 sm:px-4">
                        <p className="font-mono text-[11px] text-muted-foreground">
                            Showing {firstOnPage}–{lastOnPage} of {total}
                        </p>
                        <div className="ml-auto flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Previous page"
                                disabled={!table.getCanPreviousPage()}
                                onClick={() => table.previousPage()}
                            >
                                <CaretLeft />
                            </Button>
                            <span className="font-mono text-[11px] text-muted-foreground">
                                {pageIndex + 1} / {pages}
                            </span>
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Next page"
                                disabled={!table.getCanNextPage()}
                                onClick={() => table.nextPage()}
                            >
                                <CaretRight />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
