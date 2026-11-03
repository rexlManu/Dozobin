import { Eye, EyeSlash, Hourglass, Lock } from '@phosphor-icons/react';
import { useId, useState } from 'react';
import { ChipGroup } from '@/components/chips';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EXPIRATION_LABEL, EXPIRATION_ORDER } from '@/lib/format';
import type { ExpirationKey } from '@/lib/types';

export interface ShareOptionsValue {
    expiration: ExpirationKey;
    /** null means no password; an empty string means "on, not typed yet". */
    password: string | null;
}

/**
 * Expiry and password for the shares about to be made, as two chip rows. Every
 * window the installation knows is shown; the ones this account cannot use stay
 * visible but disabled, so a Guest can see what signing in adds.
 */
export function ShareOptions({
    value,
    onChange,
    allowed,
    known,
    canProtect,
}: {
    value: ShareOptionsValue;
    onChange: (next: ShareOptionsValue) => void;
    allowed: ExpirationKey[];
    /** Every window the installation offers anyone. */
    known: ExpirationKey[];
    canProtect: boolean;
}) {
    const [reveal, setReveal] = useState(false);
    const passwordId = useId();
    const protectionOn = value.password !== null;
    const windows = EXPIRATION_ORDER.filter(
        (key) => allowed.includes(key) || known.includes(key),
    );

    return (
        <div className="flex flex-wrap gap-x-9 gap-y-5">
            <div className="grid gap-2">
                <span className="label-meta flex items-center gap-1.5">
                    <Hourglass className="size-4" /> Link stays for
                </span>
                <ChipGroup
                    label="Link stays for"
                    value={value.expiration}
                    onChange={(expiration) =>
                        onChange({ ...value, expiration })
                    }
                    options={windows.map((key) => ({
                        value: key,
                        label: EXPIRATION_LABEL[key],
                        disabledReason: allowed.includes(key)
                            ? undefined
                            : 'Members only',
                    }))}
                />
            </div>

            <div className="grid gap-2">
                <span className="label-meta flex items-center gap-1.5">
                    <Lock className="size-4" /> Password
                </span>
                <div className="flex flex-wrap items-center gap-2">
                    <ChipGroup
                        label="Password"
                        value={protectionOn ? 'on' : 'off'}
                        onChange={(next) =>
                            onChange({
                                ...value,
                                password: next === 'on' ? '' : null,
                            })
                        }
                        options={[
                            { value: 'off', label: 'None' },
                            {
                                value: 'on',
                                label: 'Add one',
                                disabledReason: canProtect
                                    ? undefined
                                    : 'Passwords are for Members here',
                            },
                        ]}
                    />
                    {protectionOn && (
                        <div className="relative w-64 max-w-full">
                            <label htmlFor={passwordId} className="sr-only">
                                Share password
                            </label>
                            <Input
                                id={passwordId}
                                autoFocus
                                type={reveal ? 'text' : 'password'}
                                autoComplete="new-password"
                                placeholder="Password for the recipient"
                                className="pr-11"
                                value={value.password ?? ''}
                                onChange={(event) =>
                                    onChange({
                                        ...value,
                                        password: event.target.value,
                                    })
                                }
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                className="absolute top-1/2 right-1 -translate-y-1/2 hover:-translate-y-1/2"
                                aria-label={
                                    reveal ? 'Hide password' : 'Show password'
                                }
                                onClick={() => setReveal((shown) => !shown)}
                            >
                                {reveal ? <EyeSlash /> : <Eye />}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
