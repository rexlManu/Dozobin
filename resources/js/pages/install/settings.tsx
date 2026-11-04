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

function RowError({ children }: { children: ReactNode }) {
    return (
        <p className="flex items-start gap-2 text-[14px] font-bold text-destructive">
            <WarningCircle
                weight="fill"
                aria-hidden
                className="mt-0.5 size-4 shrink-0"
            />
            {children}
        </p>
    );
}

/** A switch with its label and hint, on a raised block inside the card. */
function SwitchRow({
    id,
    label,
    hint,
    checked,
    onCheckedChange,
    error,
}: {
    id: string;
    label: string;
    hint: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    error?: string;
}) {
    return (
        <div className="flex items-start gap-3 rounded-[20px] bg-sunken p-4">
            <Switch
                id={id}
                checked={checked}
                onCheckedChange={onCheckedChange}
                className="mt-0.5"
            />
            <div className="grid gap-1">
                <Label htmlFor={id} className="font-bold">
                    {label}
                </Label>
                <p className="text-[14px] text-muted-foreground">{hint}</p>
                {error !== undefined && <RowError>{error}</RowError>}
            </div>
        </div>
    );
}

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
            <Label>{label}</Label>
            {hint !== undefined && (
                <p className="-mt-0.5 text-[14px] text-muted-foreground">
                    {hint}
                </p>
            )}
            {children}
            {error !== undefined && <RowError>{error}</RowError>}
        </div>
    );
}

/**
 * A subset on purpose. The wizard asks the questions whose wrong answer is
 * embarrassing on day one (who may upload, how big, how long) and leaves the
 * rest at its defaults for Administration.
 */
function SettingsContent({ defaults }: { defaults: AdminConfig }) {
    const form = useForm<AdminConfig>({ ...defaults });
    const { data, setData, errors } = form;

    return (
        <InstallShell
            step="settings"
            title="Set the ground rules"
            intro="These apply to everyone on this installation. You can change all of them later in Administration."
        >
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    form.post('/install/settings');
                }}
                className="flex flex-col gap-6"
            >
                <SwitchRow
                    id="install-guest-sharing"
                    label="Guests may create shares"
                    hint="When off, Guests are asked to sign in. Transfer Sessions work either way."
                    checked={data.guestSharing}
                    onCheckedChange={(checked) =>
                        setData('guestSharing', checked)
                    }
                />

                <Row label="Member registration" error={errors.registration}>
                    <RadioGroup
                        value={data.registration}
                        onValueChange={(value) =>
                            setData(
                                'registration',
                                value as AdminConfig['registration'],
                            )
                        }
                        className="gap-1.5"
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
                                    'New Members need a code from an administrator.',
                                ],
                                ['closed', 'Closed', 'No new accounts at all.'],
                            ] as const
                        ).map(([value, label, hint]) => (
                            <label
                                key={value}
                                htmlFor={`install-reg-${value}`}
                                className="flex cursor-pointer gap-3 rounded-[18px] border-[1.5px] border-border px-4 py-3 transition-colors hover:border-border-strong has-data-[state=checked]:border-lavender has-data-[state=checked]:bg-lavender-soft"
                            >
                                <RadioGroupItem
                                    id={`install-reg-${value}`}
                                    value={value}
                                    className="mt-1"
                                />
                                <span>
                                    <span className="block font-bold">
                                        {label}
                                    </span>
                                    <span className="block text-[14px] text-muted-foreground">
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
                                className="w-[9rem]"
                            />
                            <span className="text-[14px] text-muted-foreground">
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
                                className="w-[9rem]"
                            />
                            <span className="text-[14px] text-muted-foreground">
                                MB
                            </span>
                        </div>
                    </Row>
                </div>

                <Row
                    label="Transfer Session inactivity window"
                    hint="A Transfer Session and its items are deleted this long after the last activity."
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
                            className="w-[9rem]"
                        />
                        <span className="text-[14px] text-muted-foreground">
                            hours
                        </span>
                    </div>
                </Row>

                <SwitchRow
                    id="install-malware-scanning"
                    label="Scan new File Shares for malware"
                    hint="Needs a reachable clamd service. Leave this off if you do not run one yet."
                    checked={data.malwareScanningEnabled}
                    onCheckedChange={(checked) =>
                        setData('malwareScanningEnabled', checked)
                    }
                    error={errors.malwareScanningEnabled}
                />

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
