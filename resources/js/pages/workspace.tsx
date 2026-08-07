import { AppProviders } from '@/components/app-providers';
import { WorkspaceRoute } from '@/screens/workspace';

export default function WorkspacePage() {
    return (
        <AppProviders>
            <WorkspaceRoute />
        </AppProviders>
    );
}
