import type { PageProps } from '@inertiajs/core';
import type { Account, AdminConfig, Appearance } from '@/lib/types';

export interface SharedPageProps extends PageProps {
    name: string;
    auth: {
        user: Account | null;
        impersonator: Account | null;
    };
    config: AdminConfig;
    appearance: Appearance;
    flash: {
        status: string | null;
    };
}
