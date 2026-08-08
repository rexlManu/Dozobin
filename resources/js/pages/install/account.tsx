import { AppProviders } from '@/components/app-providers';
import { AccountStep } from '@/screens/install';

export default function InstallAccountPage() {
    return (
        <AppProviders>
            <AccountStep />
        </AppProviders>
    );
}
