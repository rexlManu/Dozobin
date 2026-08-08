import type { PageProps } from '@inertiajs/core';
import type {
    Account,
    AdminConfig,
    Appearance,
    InstallStepKey,
} from '@/lib/types';

export interface SharedPageProps extends PageProps {
    name: string;
    auth: {
        user: Account | null;
        impersonator: Account | null;
    };
    config: AdminConfig;
    installation: {
        complete: boolean;
        step: InstallStepKey;
    };
    appearance: Appearance;
    flash: {
        status: string | null;
    };
}
