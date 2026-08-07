import { LockKey, WarningCircle } from '@phosphor-icons/react';
import { useState } from 'react';
import { ExpiryLabel } from '@/components/expiry';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function PasswordGate({
    kind,
    expiresAt,
    onUnlock,
}: {
    kind: 'file' | 'paste';
    expiresAt: number | null;
    onUnlock: (password: string) => Promise<boolean>;
}) {
    const [value, setValue] = useState('');
    const [attempts, setAttempts] = useState(0);
    const [wrong, setWrong] = useState(false);

    const noun = kind === 'file' ? 'File Share' : 'Paste';
    const throttled = attempts >= 3;

    return (
        <div className="mx-auto w-full max-w-[26rem] px-4 py-16 sm:py-24">
            <div className="flex size-11 items-center justify-center rounded-lg border border-border bg-card">
                <LockKey className="size-5 text-muted-foreground" />
            </div>
            <h1 className="mt-5 text-xl font-medium tracking-[-0.02em]">
                This {noun} is protected
            </h1>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
                Whoever created it set a password. Nothing about the contents is
                shown until the password matches, not the filename and not the
                size.
            </p>

            <form
                className="mt-6 flex flex-col gap-3"
                onSubmit={async (event) => {
                    event.preventDefault();

                    if (await onUnlock(value)) {
                        return;
                    }

                    setWrong(true);
                    setAttempts((n) => n + 1);
                }}
            >
                <div className="flex flex-col gap-2">
                    <Label htmlFor="share-password">Password</Label>
                    <Input
                        id="share-password"
                        type="password"
                        autoFocus
                        autoComplete="off"
                        aria-invalid={wrong}
                        aria-describedby={
                            wrong ? 'share-password-error' : undefined
                        }
                        value={value}
                        onChange={(event) => {
                            setValue(event.target.value);
                            setWrong(false);
                        }}
                    />
                    {wrong && (
                        <p
                            id="share-password-error"
                            className="flex items-start gap-1.5 text-[12.5px] text-destructive"
                        >
                            <WarningCircle
                                weight="fill"
                                className="mt-px size-3.5 shrink-0"
                            />
                            <span>
                                {throttled
                                    ? 'Still no match. After a few more tries this installation makes you wait a minute between attempts.'
                                    : 'That password does not match. Check for a trailing space.'}
                            </span>
                        </p>
                    )}
                </div>
                <Button type="submit" size="lg" disabled={value.length === 0}>
                    Unlock
                </Button>
            </form>

            <div className="mt-6 border-t border-border pt-4 text-[12px]">
                <ExpiryLabel expiresAt={expiresAt} />
            </div>
        </div>
    );
}
