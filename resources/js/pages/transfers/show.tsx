import { AppProviders } from '@/components/app-providers';
import type { TransferSession } from '@/lib/types';
import { TransferSessionRoute } from '@/screens/transfer-session';

export default function TransferSessionPage({
    transfer,
}: {
    transfer: TransferSession;
}) {
    return (
        <AppProviders>
            <TransferSessionRoute transfer={transfer} />
        </AppProviders>
    );
}
