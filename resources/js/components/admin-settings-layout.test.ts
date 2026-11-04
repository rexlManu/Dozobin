import { describe, expect, it } from 'vitest';
import { SETTINGS_SECTIONS } from '@/components/admin-settings-layout';
import type { AdminConfig } from '@/lib/types';

const config: AdminConfig = {
    guestSharing: false,
    registration: 'invite',
    guestExpirations: ['1h', '1d'],
    memberExpirations: ['1d', '7d'],
    guestDefaultExpiration: '1d',
    memberDefaultExpiration: '7d',
    guestPasswordProtection: true,
    defaultQuotaMb: 0,
    maxUploadMb: 512,
    fileTypeMode: 'allow',
    fileTypeList: ['png'],
    transferWindowHours: 1,
    payloadCleanupGraceHours: 24,
    malwareScanningEnabled: true,
};

const summary = (key: string) =>
    SETTINGS_SECTIONS.find((section) => section.key === key)?.summary(config);

describe('admin settings menu summaries', () => {
    it('says the current value of each page in a few words', () => {
        expect(summary('access')).toBe('Members only, invite only');
        expect(summary('limits')).toBe('No quota, 512 MB per file');
        expect(summary('file-types')).toBe('Allows only 1 type');
        expect(summary('transfer')).toBe('Ends after 1 hour idle');
        expect(summary('housekeeping')).toBe(
            'Cleanup after 24 hours, scans on',
        );
    });

    it('gives every draft field exactly one owning page', () => {
        const owned = SETTINGS_SECTIONS.flatMap((section) => section.fields);

        expect(new Set(owned).size).toBe(owned.length);
        expect([...owned].sort()).toEqual(Object.keys(config).sort());
    });
});
