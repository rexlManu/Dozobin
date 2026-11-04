import { router, usePage } from '@inertiajs/react';
import { ArrowSquareOut, Trash } from '@phosphor-icons/react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AdminLayout, AdminPageHead, Tag } from '@/components/admin-layout';
import type { TagTone } from '@/components/admin-layout';
import { AppProviders } from '@/components/app-providers';
import { ChipGroup } from '@/components/chips';
import { useConfirm } from '@/components/confirm-dialog';
import { Dozo } from '@/components/dozo';
import { Button } from '@/components/ui/button';
import { useNow } from '@/hooks/use-now';
import { TAKEDOWN_REASON_LABEL, relativeTime } from '@/lib/format';
import type { TakedownRequest, TakedownStatus } from '@/lib/types';
import type { SharedPageProps } from '@/types';

interface ReportsPageProps extends SharedPageProps {
    reports: TakedownRequest[];
}

const STATUS_LABEL: Record<TakedownStatus, string> = {
    open: 'Open',
    resolved: 'Resolved',
    dismissed: 'Dismissed',
};

const STATUS_TONE: Record<TakedownStatus, TagTone> = {
    open: 'lamp',
    resolved: 'mint',
    dismissed: 'muted',
};

type Filter = 'open' | 'handled' | 'all';

function update(
    report: TakedownRequest,
    status: TakedownStatus,
    removeShare = false,
) {
    router.patch(
        `/admin/reports/${report.id}`,
        { status, remove_share: removeShare },
        {
            preserveScroll: true,
            onSuccess: () =>
                toast(
                    removeShare
                        ? 'Share removed, report resolved'
                        : `Report ${status === 'open' ? 'opened again' : status}`,
                ),
        },
    );
}

/** What the link points to: the live share, or why there is none. */
function Target({ report }: { report: TakedownRequest }) {
    const { share } = report;

    return (
        <div className="grid min-w-0 gap-1">
            <a
                href={report.shareUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-fit max-w-full items-center gap-1.5 font-mono text-[13px] text-lavender hover:underline"
            >
                <span className="truncate">{report.shareUrl}</span>
                <ArrowSquareOut aria-hidden className="size-3.5 shrink-0" />
            </a>
            <p className="text-[13px] text-muted-foreground">
                {share === null
                    ? report.status === 'resolved'
                        ? 'The share is gone.'
                        : 'No share on this site matches this link.'
                    : [
                          share.kind === 'paste' ? 'Paste' : 'File',
                          share.name,
                          share.owner ? `by ${share.owner}` : 'by a Guest',
                          share.state !== 'ready' ? share.state : null,
                      ]
                          .filter(Boolean)
                          .join(' · ')}
            </p>
        </div>
    );
}

function ReportRow({
    report,
    now,
    onRemove,
}: {
    report: TakedownRequest;
    now: number;
    onRemove: (report: TakedownRequest) => void;
}) {
    const open = report.status === 'open';

    return (
        <article className="grid gap-3.5 rounded-[22px] border-[1.5px] border-border bg-card p-[18px] sm:p-[22px]">
            <div className="flex flex-wrap items-center gap-2">
                <Tag tone={STATUS_TONE[report.status]}>
                    {STATUS_LABEL[report.status]}
                </Tag>
                <Tag tone="lavender">
                    {TAKEDOWN_REASON_LABEL[report.reason]}
                </Tag>
                <span className="text-[13px] text-muted-foreground">
                    {relativeTime(report.createdAt, now)}
                </span>
                <div className="ml-auto flex flex-wrap gap-1.5">
                    {open ? (
                        <>
                            {report.share && (
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => onRemove(report)}
                                >
                                    <Trash /> Remove share
                                </Button>
                            )}
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => update(report, 'resolved')}
                            >
                                Resolve
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => update(report, 'dismissed')}
                            >
                                Dismiss
                            </Button>
                        </>
                    ) : (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => update(report, 'open')}
                        >
                            Open again
                        </Button>
                    )}
                </div>
            </div>

            <Target report={report} />

            <p className="leading-relaxed whitespace-pre-wrap">
                {report.details}
            </p>

            <p className="flex flex-wrap gap-x-2 text-[13px] text-muted-foreground">
                <span>
                    From{' '}
                    <span className="font-bold text-foreground/85">
                        {report.reporterName ?? 'no name given'}
                    </span>
                </span>
                <a
                    href={`mailto:${report.reporterEmail}`}
                    className="font-bold text-foreground/85 underline decoration-border-strong underline-offset-4 hover:text-foreground"
                >
                    {report.reporterEmail}
                </a>
                {report.handledAt !== null && (
                    <span>
                        · {STATUS_LABEL[report.status]}
                        {report.handledBy ? ` by ${report.handledBy}` : ''}{' '}
                        {relativeTime(report.handledAt, now)}
                    </span>
                )}
            </p>
        </article>
    );
}

function ReportsContent() {
    const { reports } = usePage<ReportsPageProps>().props;
    const now = useNow(60_000);
    const { confirm, dialog } = useConfirm();
    const openCount = reports.filter((r) => r.status === 'open').length;
    const [filter, setFilter] = useState<Filter>(
        openCount > 0 ? 'open' : 'all',
    );

    const shown = useMemo(
        () =>
            reports.filter((report) =>
                filter === 'all'
                    ? true
                    : filter === 'open'
                      ? report.status === 'open'
                      : report.status !== 'open',
            ),
        [reports, filter],
    );

    const remove = async (report: TakedownRequest) => {
        const ok = await confirm({
            title: 'Remove this share?',
            description:
                'The share and its file or text are deleted, and the link stops working. The report is marked resolved.',
            confirmLabel: 'Remove share',
        });

        if (ok) {
            update(report, 'resolved', true);
        }
    };

    return (
        <>
            <AdminPageHead
                title="Reports"
                description="Takedown requests sent through the report form. Check the content, then remove it, resolve the report or dismiss it."
            />
            <ChipGroup
                label="Show reports"
                value={filter}
                onChange={setFilter}
                options={[
                    { value: 'open', label: `Open ${openCount}` },
                    { value: 'handled', label: 'Handled' },
                    { value: 'all', label: `All ${reports.length}` },
                ]}
            />
            {shown.length === 0 ? (
                <div className="grid justify-items-center gap-3 rounded-[22px] border-[1.5px] border-border bg-card px-6 py-12 text-center">
                    <Dozo mood="sleep" size={72} />
                    <p className="text-[17px] font-bold">
                        {filter === 'open' ? 'No open reports' : 'No reports'}
                    </p>
                    <p className="max-w-[40ch] text-muted-foreground">
                        Reports from the Report content form show up here.
                    </p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {shown.map((report) => (
                        <ReportRow
                            key={report.id}
                            report={report}
                            now={now}
                            onRemove={remove}
                        />
                    ))}
                </div>
            )}
            {dialog}
        </>
    );
}

export default function ReportsPage() {
    return (
        <AppProviders>
            <AdminLayout>
                <ReportsContent />
            </AdminLayout>
        </AppProviders>
    );
}
