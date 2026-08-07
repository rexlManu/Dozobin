import { AppProviders } from '@/components/app-providers';
import type { PasteShare } from '@/lib/types';
import { PasteViewRoute } from '@/screens/paste-view';

export default function PastePage({
    share,
    unlocked,
}: {
    share: PasteShare;
    unlocked: boolean;
}) {
    return (
        <AppProviders>
            <PasteViewRoute share={share} unlocked={unlocked} />
        </AppProviders>
    );
}
