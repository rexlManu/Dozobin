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
import { Dozo } from '@/components/dozo';
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
 * the soft row frame, the sortable head, the selection bar and the pager.
 *
 * Rows are separate panels (`border-separate` with a row gap), so a desktop
 * table reads like the upload rows on the Send page while staying a real table.
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
    /** Short copy for an empty result. Dozo sits above it. */
    empty: React.ReactNode;
    /**
     * An alternative body for the same rows. The table stays the model, so every
     * filter, sort and page still applies and only the drawing changes.
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
    const selectable = table
        .getAllLeafColumns()
        .some((column) => column.id === 'select');
    const firstOnPage = total === 0 ? 0 : pageIndex * pageSize + 1;
    const lastOnPage = Math.min(total, (pageIndex + 1) * pageSize);
    const selecting = selected > 0 && selectionBar !== undefined;

    const selectionActions = (
        <>
            <span className="font-bold text-lavender">{selected} selected</span>
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
    );

    /*
      The head of a layout without column heads (phone rows, the tile grid).
      Select-all and the bulk actions still need a home, so they get this band.
    */
    const strip = (
        <div
            className={cn(
                'flex min-h-11 flex-wrap items-center gap-3 rounded-[18px] px-3.5 py-1.5',
                selecting && 'bg-lavender-soft',
            )}
        >
            {selectable && (
                <Checkbox
                    aria-label="Select everything on this page"
                    checked={table.getIsAllPageRowsSelected()}
                    onCheckedChange={(v) =>
                        table.toggleAllPageRowsSelected(v === true)
                    }
                />
            )}
            {selecting ? (
                selectionActions
            ) : (
                <span className="label-meta">
                    {total} {total === 1 ? unit : `${unit}s`}
                </span>
            )}
        </div>
    );

    return (
        <div className="flex flex-col gap-3">
            {toolbar}

            {rows.length === 0 ? (
                <div className="grid justify-items-center gap-1.5 rounded-[28px] border-[1.5px] border-border bg-card px-6 py-10 text-center">
                    <Dozo size={72} mood="sleep" className="mb-2" />
                    {empty}
                </div>
            ) : grid ? (
                <div className="flex flex-col gap-2">
                    {strip}
                    {grid}
                </div>
            ) : (
                <>
                    {/*
                      A phone cannot read a nine-column table. Below `md` the same
                      rows redraw as soft rows: same instance, filters and page.
                    */}
                    {card && (
                        <div className="flex flex-col gap-2 md:hidden">
                            {strip}
                            <ul className="flex flex-col gap-2">
                                {rows.map((row) => (
                                    <li
                                        key={row.id}
                                        className={cn(
                                            'rounded-[20px] px-3.5 py-3 transition-colors',
                                            row.getIsSelected()
                                                ? 'bg-accent'
                                                : 'bg-card',
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
                        <table className="w-full border-separate border-spacing-y-1.5 text-left">
                            <thead>
                                {selecting ? (
                                    <tr>
                                        <th
                                            colSpan={
                                                table.getVisibleLeafColumns()
                                                    .length
                                            }
                                            className="rounded-[18px] bg-lavender-soft px-3.5 py-1.5 font-medium"
                                        >
                                            <div className="flex min-h-8 flex-wrap items-center gap-3">
                                                {selectionActions}
                                            </div>
                                        </th>
                                    </tr>
                                ) : (
                                    table.getHeaderGroups().map((group) => (
                                        <tr key={group.id}>
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
                                                            'label-meta px-3 py-1.5 whitespace-nowrap first:pl-3.5',
                                                            header.column
                                                                .columnDef.meta
                                                                ?.className,
                                                        )}
                                                    >
                                                        {header.isPlaceholder ? null : sortable ? (
                                                            <button
                                                                type="button"
                                                                onClick={header.column.getToggleSortingHandler()}
                                                                className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
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
                                                                        className="size-3 text-lavender"
                                                                    />
                                                                ) : sorted ===
                                                                  'desc' ? (
                                                                    <CaretDown
                                                                        weight="bold"
                                                                        className="size-3 text-lavender"
                                                                    />
                                                                ) : (
                                                                    <CaretUpDown className="size-3 opacity-40" />
                                                                )}
                                                            </button>
                                                        ) : (
                                                            flexRender(
                                                                header.column
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

                            <tbody>
                                {rows.map((row) => (
                                    <tr
                                        key={row.id}
                                        data-state={
                                            row.getIsSelected()
                                                ? 'selected'
                                                : undefined
                                        }
                                        className="group"
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <td
                                                key={cell.id}
                                                className={cn(
                                                    'bg-card px-3 py-2.5 align-middle transition-colors group-hover:bg-sunken group-data-[state=selected]:bg-accent first:rounded-l-[18px] first:pl-3.5 last:rounded-r-[18px]',
                                                    cell.column.columnDef.meta
                                                        ?.className,
                                                )}
                                            >
                                                {flexRender(
                                                    cell.column.columnDef.cell,
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

            {/* A pager for one page is furniture, so it only appears when it works. */}
            {pages > 1 && (
                <div className="flex items-center gap-3 px-1">
                    <p className="text-[13px] text-muted-foreground">
                        {firstOnPage}–{lastOnPage} of {total}
                    </p>
                    <div className="ml-auto flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="icon-sm"
                            aria-label="Previous page"
                            disabled={!table.getCanPreviousPage()}
                            onClick={() => table.previousPage()}
                        >
                            <CaretLeft />
                        </Button>
                        <span className="px-1.5 text-[13px] font-bold tabular-nums">
                            {pageIndex + 1} / {pages}
                        </span>
                        <Button
                            variant="outline"
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
    );
}
