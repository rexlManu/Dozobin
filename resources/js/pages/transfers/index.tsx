import { AppProviders } from '@/components/app-providers';
import type { TransferSession } from '@/lib/types';
import { TransferLobbyRoute } from '@/screens/transfer-lobby';

export default function TransferLobbyPage({
    transfer,
}: {
    transfer: TransferSession | null;
}) {
    return (
        <AppProviders>
            <TransferLobbyRoute transfer={transfer} />
        </AppProviders>
    );
}
