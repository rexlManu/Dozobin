import { useForm } from '@inertiajs/react';
import { WarningCircle } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { AppProviders } from '@/components/app-providers';
import { InstallShell } from '@/components/install-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { EXPIRATION_LABEL } from '@/lib/format';
import type { AdminConfig, ExpirationKey } from '@/lib/types';

function Row({
    label,
    hint,
    error,
    children,
}: {
    label: string;
    hint?: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <div className="flex flex-col gap-2">
            <Label className="text-[13px]">{label}</Label>
            {hint !== undefined && (
                <p className="-mt-1 text-[12px] leading-relaxed text-muted-foreground">
                    {hint}
                </p>
            )}
            {children}
            {error !== undefined && (
                <p className="flex items-start gap-1.5 text-[12.5px] text-destructive">
                    <WarningCircle
                        weight="fill"
                        aria-hidden
                        className="mt-px size-3.5 shrink-0"
                    />
                    {error}
                </p>
            )}
        </div>
    );
}

/**
 * A subset on purpose. The wizard asks the questions whose wrong answer is
 * embarrassing on day one — who may upload, how big, how long — and leaves the
 * rest at its defaults for Administration.
 */
function SettingsContent({ defaults }: { defaults: AdminConfig }) {
    const form = useForm<AdminConfig>({ ...defaults });
    const { data, setData, errors } = form;

    return (
        <InstallShell
            step="settings"
            title="Set the ground rules"
            intro="These apply to everyone on this server. Every one of them, plus the expiration choices and blocked file types, stays editable under Administration afterwards."
        >
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    form.post('/install/settings');
                }}
                className="flex flex-col gap-6"
            >
                <div className="flex items-start gap-3">
                    <Switch
                        id="install-guest-sharing"
                        checked={data.guestSharing}
                        onCheckedChange={(checked) =>
                            setData('guestSharing', checked)
                        }
                    />
                    <div>
                        <Label
                            htmlFor="install-guest-sharing"
                            className="text-[13px]"
                        >
                            Guests may create shares
                        </Label>
                        <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                            With this off, signed-out visitors are asked to sign
                            in. Transfer Sessions keep working either way.
                        </p>
                    </div>
                </div>

                <Row label="Member registration" error={errors.registration}>
                    <RadioGroup
                        value={data.registration}
                        onValueChange={(value) =>
                            setData(
                                'registration',
                                value as AdminConfig['registration'],
                            )
                        }
                        className="gap-2.5"
                    >
                        {(
                            [
                                [
                                    'open',
                                    'Open',
                                    'Anyone can create an account.',
                                ],
                                [
                                    'invite',
                                    'Invite only',
                                    'Registration needs the code in DOZOBIN_INVITE_CODE.',
                                ],
                                ['closed', 'Closed', 'No new accounts at all.'],
                            ] as const
                        ).map(([value, label, hint]) => (
                            <label
                                key={value}
                                htmlFor={`install-reg-${value}`}
                                className="flex cursor-pointer gap-2.5"
                            >
                                <RadioGroupItem
                                    id={`install-reg-${value}`}
                                    value={value}
                                    className="mt-0.5"
                                />
                                <span>
                                    <span className="block text-[13px]">
                                        {label}
                                    </span>
                                    <span className="block text-[12px] text-muted-foreground">
                                        {hint}
                                    </span>
                                </span>
                            </label>
                        ))}
                    </RadioGroup>
                </Row>

                <div className="grid gap-5 sm:grid-cols-2">
                    <Row
                        label="Default expiration for Guests"
                        error={errors.guestDefaultExpiration}
                    >
                        <Select
                            value={data.guestDefaultExpiration}
                            onValueChange={(value) =>
                                setData(
                                    'guestDefaultExpiration',
                                    value as ExpirationKey,
                                )
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {data.guestExpirations.map((key) => (
                                    <SelectItem key={key} value={key}>
                                        {EXPIRATION_LABEL[key]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Row>

                    <Row
                        label="Default expiration for Members"
                        error={errors.memberDefaultExpiration}
                    >
                        <Select
                            value={data.memberDefaultExpiration}
                            onValueChange={(value) =>
                                setData(
                                    'memberDefaultExpiration',
                                    value as ExpirationKey,
                                )
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {data.memberExpirations.map((key) => (
                                    <SelectItem key={key} value={key}>
                                        {EXPIRATION_LABEL[key]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Row>

                    <Row label="Maximum upload size" error={errors.maxUploadMb}>
                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                min={1}
                                value={data.maxUploadMb}
                                aria-invalid={Boolean(errors.maxUploadMb)}
                                onChange={(event) =>
                                    setData(
                                        'maxUploadMb',
                                        Number(event.target.value),
                                    )
                                }
                                className="w-[9rem] font-mono"
                            />
                            <span className="font-mono text-[12px] text-muted-foreground">
                                MB per file
                            </span>
                        </div>
                    </Row>

                    <Row
                        label="Default Member quota"
                        hint="Applies to accounts created from here on."
                        error={errors.defaultQuotaMb}
                    >
                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                min={1}
                                value={data.defaultQuotaMb}
                                aria-invalid={Boolean(errors.defaultQuotaMb)}
                                onChange={(event) =>
                                    setData(
                                        'defaultQuotaMb',
                                        Number(event.target.value),
                                    )
                                }
                                className="w-[9rem] font-mono"
                            />
                            <span className="font-mono text-[12px] text-muted-foreground">
                                MB
                            </span>
                        </div>
                    </Row>
                </div>

                <Row
                    label="Transfer Session inactivity window"
                    hint="A session and everything in it is deleted this long after the last thing anyone does in it."
                    error={errors.transferWindowHours}
                >
                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            min={1}
                            max={168}
                            value={data.transferWindowHours}
                            aria-invalid={Boolean(errors.transferWindowHours)}
                            onChange={(event) =>
                                setData(
                                    'transferWindowHours',
                                    Number(event.target.value),
                                )
                            }
                            className="w-[9rem] font-mono"
                        />
                        <span className="font-mono text-[12px] text-muted-foreground">
                            hours
                        </span>
                    </div>
                </Row>

                <div className="flex items-start gap-3 border-t border-border pt-5">
                    <Switch
                        id="install-malware-scanning"
                        checked={data.malwareScanningEnabled}
                        onCheckedChange={(checked) =>
                            setData('malwareScanningEnabled', checked)
                        }
                    />
                    <div>
                        <Label
                            htmlFor="install-malware-scanning"
                            className="text-[13px]"
                        >
                            Scan new File Shares for malware
                        </Label>
                        <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                            Needs a reachable clamd service. Leave this off if
                            you have not run one alongside Dōzobin yet.
                        </p>
                        {errors.malwareScanningEnabled !== undefined && (
                            <p className="mt-1 text-[12px] text-destructive">
                                {errors.malwareScanningEnabled}
                            </p>
                        )}
                    </div>
                </div>

                <div>
                    <Button type="submit" size="lg" disabled={form.processing}>
                        Finish installation
                    </Button>
                </div>
            </form>
        </InstallShell>
    );
}

export default function InstallSettingsPage({
    defaults,
}: {
    defaults: AdminConfig;
}) {
    return (
        <AppProviders>
            <SettingsContent defaults={defaults} />
        </AppProviders>
    );
}
