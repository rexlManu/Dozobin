export function maskApiToken(token: string): string {
    return `${token.slice(0, 9)}${'•'.repeat(12)}${token.slice(-4)}`;
}
