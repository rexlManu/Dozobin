import { usePage } from '@inertiajs/react';
import { AppProviders } from '@/components/app-providers';
import { LegalDocument } from '@/components/legal-document';
import { Link } from '@/lib/navigation';
import type { SharedPageProps } from '@/types';

function PrivacyContent() {
    const { name } = usePage<SharedPageProps>().props;

    return (
        <LegalDocument
            title="Privacy Policy"
            intro={`This page tells you which data ${name} keeps, why, and for how long.`}
            sections={[
                {
                    title: 'Who is responsible',
                    body: (
                        <p>
                            The operator of this site is responsible for your
                            data. The operator is the person or organisation
                            that hosts {name}.
                        </p>
                    ),
                },
                {
                    title: 'What we keep',
                    body: (
                        <ul>
                            <li>
                                <strong>Account data</strong>: your name, email
                                address, settings, and your password as a
                                one-way hash. Only if you create an account.
                            </li>
                            <li>
                                <strong>Content</strong>: the files and text you
                                share, with their names, sizes, times and view
                                counts.
                            </li>
                            <li>
                                <strong>Transfer Sessions</strong>: the items
                                and device names in a session. They are deleted
                                completely when the session ends.
                            </li>
                            <li>
                                <strong>Technical data</strong>: IP addresses,
                                browser and device details in server logs and
                                sign-in records. We use them for security and to
                                stop abuse.
                            </li>
                            <li>
                                <strong>Reports</strong>: the name, email
                                address and message you send with a takedown
                                request.
                            </li>
                        </ul>
                    ),
                },
                {
                    title: 'Cookies',
                    body: (
                        <p>
                            We use only the cookies the service needs: to keep
                            you signed in, to protect forms, and to remember an
                            unlocked password or a Transfer Session. If the
                            operator adds an analytics service, that service can
                            set its own cookies.
                        </p>
                    ),
                },
                {
                    title: 'Why we keep it',
                    body: (
                        <p>
                            To run the service you ask for, to keep it secure,
                            to stop abuse, and to follow the law. We do not sell
                            your data and do not use it for advertising.
                        </p>
                    ),
                },
                {
                    title: 'Who can see it',
                    body: (
                        <p>
                            Anyone with a link can open the content behind it.
                            The operator can see all data on this site. Our
                            hosting and storage providers process data for us.
                            We give data to authorities only when the law
                            requires it.
                        </p>
                    ),
                },
                {
                    title: 'How long we keep it',
                    body: (
                        <p>
                            Content stays until its link expires, plus a short
                            cleanup time, or until you delete it. Account data
                            stays until you delete your account. Logs and
                            reports stay only as long as we need them for
                            security, abuse handling or the law.
                        </p>
                    ),
                },
                {
                    title: 'Your rights',
                    body: (
                        <p>
                            You can ask for a copy of your data, ask us to
                            correct it, or ask us to delete it. You can delete
                            your shares and your account yourself in{' '}
                            <Link
                                to="/settings"
                                className="font-bold text-lavender underline underline-offset-4"
                            >
                                Settings
                            </Link>
                            . Depending on where you live, you can also complain
                            to a data protection authority.
                        </p>
                    ),
                },
                {
                    title: 'Changes',
                    body: (
                        <p>
                            We can change this policy at any time. The version
                            on this page is the one that applies.
                        </p>
                    ),
                },
            ]}
        />
    );
}

export default function PrivacyPage() {
    return (
        <AppProviders>
            <PrivacyContent />
        </AppProviders>
    );
}
