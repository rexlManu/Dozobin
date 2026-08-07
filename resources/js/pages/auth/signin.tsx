import { AppProviders } from '@/components/app-providers';
import { SignInRoute } from '@/screens/auth';

export default function SignInPage() {
    return (
        <AppProviders>
            <SignInRoute />
        </AppProviders>
    );
}
