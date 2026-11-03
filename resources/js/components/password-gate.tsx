import { WarningCircle } from '@phosphor-icons/react';
import { useState } from 'react';
import { ExpiryLabel } from '@/components/expiry';
import { StateNote } from '@/components/state-note';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/** Asks for a share's password. Shows nothing about the contents until it matches. */
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
    const throttled = attempts >= 3;

    return (
        <StateNote
            mood={wrong ? 'wow' : 'calm'}
            title={`This ${kind === 'file' ? 'file' : 'text'} is locked`}
        >
            <p className="text-muted-foreground">
                The sender added a password. Ask them for it, then type it here.
            </p>
            <form
                className="grid w-full gap-3 text-left"
                onSubmit={async (event) => {
                    event.preventDefault();

                    if (await onUnlock(value)) {
                        return;
                    }

                    setWrong(true);
                    setAttempts((count) => count + 1);
                }}
            >
                <label htmlFor="share-password" className="sr-only">
                    Password
                </label>
                <Input
                    id="share-password"
                    type="password"
                    autoFocus
                    autoComplete="off"
                    placeholder="Password"
                    aria-invalid={wrong}
                    aria-describedby={
                        wrong ? 'share-password-error' : undefined
                    }
                    className="h-12 text-[18px] md:text-[18px]"
                    value={value}
                    onChange={(event) => {
                        setValue(event.target.value);
                        setWrong(false);
                    }}
                />
                {wrong && (
                    <p
                        id="share-password-error"
                        className="flex items-start gap-1.5 font-bold text-destructive"
                    >
                        <WarningCircle
                            weight="fill"
                            className="mt-0.5 size-4 shrink-0"
                        />
                        {throttled
                            ? 'Still not right. After a few more tries you have to wait a minute.'
                            : 'That password did not fit. Check for a space at the end.'}
                    </p>
                )}
                <Button type="submit" size="lg" disabled={value.length === 0}>
                    Open
                </Button>
            </form>
            <ExpiryLabel expiresAt={expiresAt} className="text-[13px]" />
        </StateNote>
    );
}
