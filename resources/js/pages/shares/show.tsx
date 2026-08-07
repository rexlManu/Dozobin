import { AppProviders } from '@/components/app-providers';
import type { FileShare } from '@/lib/types';
import { ShareViewRoute } from '@/screens/share-view';

export default function SharePage({
    share,
    unlocked,
}: {
    share: FileShare;
    unlocked: boolean;
}) {
    return (
        <AppProviders>
            <ShareViewRoute share={share} unlocked={unlocked} />
        </AppProviders>
    );
}
