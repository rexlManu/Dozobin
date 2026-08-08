import { AppProviders } from '@/components/app-providers';
import type { InstallDatabaseStatus, InstallRequirement } from '@/lib/types';
import { DatabaseStep } from '@/screens/install';

export default function InstallDatabasePage({
    database,
    requirements,
}: {
    database: InstallDatabaseStatus;
    requirements: InstallRequirement[];
}) {
    return (
        <AppProviders>
            <DatabaseStep database={database} requirements={requirements} />
        </AppProviders>
    );
}
