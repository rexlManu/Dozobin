import { useEffect } from 'react';
import App from '@/dozobin-app';
import type { DozoStateSnapshot } from '@/store/store';
import { useDozo } from '@/store/store';

interface DozobinPageProps {
    screen: string;
    routeParams: Record<string, string>;
    state: DozoStateSnapshot;
}

export default function DozobinPage({ screen, state }: DozobinPageProps) {
    const hydratedSnapshot = useDozo((current) => current.hydratedSnapshot);
    const hydrate = useDozo((current) => current.hydrate);

    useEffect(() => {
        hydrate(state);
    }, [hydrate, state]);

    if (hydratedSnapshot !== state) {
        return null;
    }

    return <App screen={screen} />;
}
