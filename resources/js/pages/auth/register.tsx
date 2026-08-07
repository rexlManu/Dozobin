import { AppProviders } from '@/components/app-providers';
import { RegisterRoute } from '@/screens/auth';

export default function RegisterPage() {
    return (
        <AppProviders>
            <RegisterRoute />
        </AppProviders>
    );
}
