export function ShareMetaRow({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex items-baseline justify-between gap-4 py-2">
            <dt className="label-mono shrink-0">{label}</dt>
            <dd className="min-w-0 text-right text-[12.5px] break-words">
                {children}
            </dd>
        </div>
    );
}
