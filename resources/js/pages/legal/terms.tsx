import { usePage } from '@inertiajs/react';
import { AppProviders } from '@/components/app-providers';
import { LegalDocument } from '@/components/legal-document';
import { Link } from '@/lib/navigation';
import type { SharedPageProps } from '@/types';

function TermsContent() {
    const { name } = usePage<SharedPageProps>().props;

    return (
        <LegalDocument
            title="Terms of Service"
            intro={`These terms apply when you use ${name}. When you use the service, you agree to them. If you do not agree, do not use it.`}
            sections={[
                {
                    title: 'Who runs this service',
                    body: (
                        <p>
                            {name} is run by its operator ("we", "us"). The
                            operator is the person or organisation that hosts
                            this site. The open source software it runs on is
                            not part of this agreement.
                        </p>
                    ),
                },
                {
                    title: 'Your content',
                    body: (
                        <>
                            <p>
                                You keep the rights to what you upload. You give
                                us the permission we need to store, copy and
                                send your content to the people who open your
                                links.
                            </p>
                            <p>
                                You are responsible for your content, for the
                                links you share and for who receives them. Only
                                upload content that you have the right to share.
                            </p>
                        </>
                    ),
                },
                {
                    title: 'What you must not share',
                    body: (
                        <ul>
                            <li>
                                Content that is illegal where you or we are.
                            </li>
                            <li>
                                Content that breaks copyright, trademarks or
                                other rights of someone else.
                            </li>
                            <li>
                                Malware, phishing pages or anything made to harm
                                devices or people.
                            </li>
                            <li>
                                Private information about other people without
                                their permission.
                            </li>
                            <li>
                                Content that harasses, threatens or exploits
                                anyone, and any sexual content involving minors.
                            </li>
                            <li>
                                Spam, or use that overloads or attacks the
                                service.
                            </li>
                        </ul>
                    ),
                },
                {
                    title: 'What we can do',
                    body: (
                        <p>
                            We can remove any content, disable any link, and
                            suspend or delete any account at any time. We can do
                            this with or without notice and without giving a
                            reason. We can also change, limit or stop the
                            service.
                        </p>
                    ),
                },
                {
                    title: 'No guarantee',
                    body: (
                        <>
                            <p>
                                The service is provided "as is" and "as
                                available", without any warranty. We do not
                                promise that it is always online, free of
                                errors, or that your content is kept.
                            </p>
                            <p>
                                Links expire and content is deleted. Keep your
                                own copies. Do not use this service as your only
                                backup.
                            </p>
                        </>
                    ),
                },
                {
                    title: 'Limitation of liability',
                    body: (
                        <p>
                            As far as the law allows, we are not liable for any
                            loss of data, profit, business or reputation, or for
                            any indirect or consequential damage that comes from
                            your use of the service or from content that others
                            share.
                        </p>
                    ),
                },
                {
                    title: 'Your responsibility to us',
                    body: (
                        <p>
                            If someone makes a claim against us because of your
                            content or your use of the service, you agree to
                            cover the costs and damages that follow, as far as
                            the law allows.
                        </p>
                    ),
                },
                {
                    title: 'Reporting content',
                    body: (
                        <p>
                            If you think content on this site breaks these terms
                            or the law, send us a{' '}
                            <Link
                                to="/takedown"
                                className="font-bold text-lavender underline underline-offset-4"
                            >
                                takedown request
                            </Link>
                            .
                        </p>
                    ),
                },
                {
                    title: 'Changes and law',
                    body: (
                        <p>
                            We can change these terms at any time. When you use
                            the service after a change, you accept the new
                            terms. The law of the country where the operator is
                            based applies, unless the law where you live gives
                            you stronger rights.
                        </p>
                    ),
                },
            ]}
        />
    );
}

export default function TermsPage() {
    return (
        <AppProviders>
            <TermsContent />
        </AppProviders>
    );
}
