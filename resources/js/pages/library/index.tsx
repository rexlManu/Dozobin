import { AppProviders } from '@/components/app-providers';
import type { Share } from '@/lib/types';
import { LibraryRoute } from '@/screens/library';

export default function LibraryPage({ shares }: { shares: Share[] }) {
    return (
        <AppProviders>
            <LibraryRoute shares={shares} />
        </AppProviders>
    );
}
