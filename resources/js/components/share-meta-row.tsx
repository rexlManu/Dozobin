/** One fact about a share, as a term and its value. Used inside a <dl>. */
export function ShareMetaRow({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="grid grid-cols-[96px_minmax(0,1fr)] items-baseline gap-3 py-1">
            <dt className="text-[13px] text-muted-foreground">{label}</dt>
            <dd className="min-w-0 break-words">{children}</dd>
        </div>
    );
}
