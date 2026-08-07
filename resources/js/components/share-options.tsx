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
    allowed,
    canProtect,
    isGuest,
    disabled,
}: {
    value: ShareOptionsValue;
    onChange: (next: ShareOptionsValue) => void;
    allowed: ExpirationKey[];
    canProtect: boolean;
    isGuest: boolean;
    disabled?: boolean;
}) {
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
                    <span className="flex items-center gap-1.5 text-[12.5px] font-normal text-muted-foreground">
                        {protectionOn && (
                            <Lock weight="fill" className="size-3" />
                        )}
                        {protectionOn ? 'Password' : 'No password'}
                    </span>
                    <CaretDown className="size-3 text-muted-foreground" />
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
                                    <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id={passwordId}
                                        type={reveal ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        placeholder="Password recipients will need"
                                        className="pr-10 pl-9"
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
                                        className="absolute top-1/2 right-1 -translate-y-1/2"
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
                            <div className="flex flex-col gap-2 text-[12px] leading-relaxed text-muted-foreground">
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
                                        className="underline decoration-border-strong underline-offset-4 hover:decoration-foreground"
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
