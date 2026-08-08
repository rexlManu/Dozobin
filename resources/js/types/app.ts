import type { PageProps } from '@inertiajs/core';
import type {
    Account,
    AdminConfig,
    Appearance,
    InstallStepKey,
} from '@/lib/types';

export interface SharedPageProps extends PageProps {
    name: string;
    serverNow: number;
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
    seo: {
        description: string;
        robots: string;
        canonical: string | null;
        image: string | null;
    };
    flash: {
        status: string | null;
    };
}
