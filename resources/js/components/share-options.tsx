import { CaretDown, Eye, EyeSlash, Lock } from '@phosphor-icons/react';
import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { EXPIRATION_LABEL, EXPIRATION_ORDER } from '@/lib/format';
import { Link } from '@/lib/navigation';
import type { ExpirationKey } from '@/lib/types';
import { useDozo } from '@/store/store';

export interface ShareOptionsValue {
    expiration: ExpirationKey;
    password: string | null;
}

/**
 * Expiry and password describe the share you are about to make, not the window
 * you are making it in, so they collapse to one control that states the current
 * answer and opens for the rest. The installation's policy lives inside, next
 * to the choice it constrains, rather than as standing footer prose.
 */
export function ShareOptions({
    value,
    onChange,
    disabled,
}: {
    value: ShareOptionsValue;
    onChange: (next: ShareOptionsValue) => void;
    disabled?: boolean;
}) {
    const allowed = useDozo((s) => s.allowedExpirations());
    const canProtect = useDozo((s) => s.canProtect());
    const isGuest = useDozo((s) => s.currentAccountId === null);
    const [reveal, setReveal] = useState(false);
    const passwordId = useId();
    const protectId = useId();

    const options = EXPIRATION_ORDER.filter((key) => allowed.includes(key));
    const protectionOn = value.password !== null;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={disabled}
                    className="gap-2"
                >
                    <span className="font-mono text-[11.5px]">
                        {EXPIRATION_LABEL[value.expiration]}
                    </span>
                    <span aria-hidden className="text-border-strong">
                        ·
                    </span>
                    <span className="text-muted-foreground flex items-center gap-1.5 text-[12.5px] font-normal">
                        {protectionOn && (
                            <Lock weight="fill" className="size-3" />
                        )}
                        {protectionOn ? 'Password' : 'No password'}
                    </span>
                    <CaretDown className="text-muted-foreground size-3" />
                </Button>
            </PopoverTrigger>

            <PopoverContent align="end" side="top" className="w-[21rem]">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        {/* Plain sans, matching the password row below and the form labels
                in Settings. The uppercase mono label is for column heads and
                machine truths, not for a two-word field label in a popover. */}
                        <Label
                            htmlFor="share-expiration"
                            className="text-[13px] font-normal"
                        >
                            Expires
                        </Label>
                        <Select
                            value={value.expiration}
                            disabled={disabled}
                            onValueChange={(next) =>
                                onChange({
                                    ...value,
                                    expiration: next as ExpirationKey,
                                })
                            }
                        >
                            <SelectTrigger
                                id="share-expiration"
                                className="w-full"
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {options.map((key) => (
                                    <SelectItem key={key} value={key}>
                                        {EXPIRATION_LABEL[key]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="rule" />

                    <div className="flex flex-col gap-2.5">
                        <div className="flex items-center gap-2.5">
                            <Switch
                                id={protectId}
                                checked={protectionOn}
                                disabled={disabled || !canProtect}
                                onCheckedChange={(on) =>
                                    onChange({
                                        ...value,
                                        password: on ? '' : null,
                                    })
                                }
                            />
                            <Label
                                htmlFor={protectId}
                                className="text-[13px] font-normal"
                            >
                                {canProtect
                                    ? 'Ask for a password'
                                    : 'Passwords are for Members here'}
                            </Label>
                        </div>

                        {protectionOn && (
                            <>
                                <Label htmlFor={passwordId} className="sr-only">
                                    Share password
                                </Label>
                                <div className="relative">
                                    <Lock className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                                    <Input
                                        id={passwordId}
                                        type={reveal ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        placeholder="Password recipients will need"
                                        className="pl-9 pr-10"
                                        value={value.password ?? ''}
                                        disabled={disabled}
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
                                        className="absolute right-1 top-1/2 -translate-y-1/2"
                                        aria-label={
                                            reveal
                                                ? 'Hide password'
                                                : 'Show password'
                                        }
                                        onClick={() => setReveal((v) => !v)}
                                    >
                                        {reveal ? <EyeSlash /> : <Eye />}
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>

                    {isGuest && (
                        <>
                            <div className="rule" />
                            <div className="text-muted-foreground flex flex-col gap-2 text-[12px] leading-relaxed">
                                <p>
                                    This installation gives Guests{' '}
                                    {options
                                        .map((key) =>
                                            EXPIRATION_LABEL[key].toLowerCase(),
                                        )
                                        .join(', ')}
                                    {canProtect
                                        ? ' and allows password protection.'
                                        : ' and reserves passwords for Members.'}
                                </p>
                                {/* Where a Guest is actually deciding what happens to a share is
                    where it matters that no Library will remember it. */}
                                <p>
                                    Sharing as a Guest.{' '}
                                    <Link
                                        to="/signin"
                                        className="decoration-border-strong hover:decoration-foreground underline underline-offset-4"
                                    >
                                        Sign in
                                    </Link>{' '}
                                    to keep a Library.
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
