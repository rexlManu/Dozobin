import { createInertiaApp } from '@inertiajs/react';
import { formatPageTitle } from '@/lib/app-title';

createInertiaApp({
    title: formatPageTitle,
    progress: {
        color: '#4B5563',
    },
});
