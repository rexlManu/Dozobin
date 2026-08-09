interface TitlePage {
    props: {
        [key: string]: unknown;
        name?: unknown;
    };
}

export function formatPageTitle(title: string, page: TitlePage): string {
    const appName =
        typeof page.props.name === 'string' && page.props.name.trim() !== ''
            ? page.props.name
            : 'Dōzobin';

    return title ? `${title} - ${appName}` : appName;
}
