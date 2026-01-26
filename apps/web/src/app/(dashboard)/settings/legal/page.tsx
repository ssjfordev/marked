import Link from 'next/link';

const legalLinks = [
  {
    title: 'Terms of Service',
    description: 'Read our terms and conditions for using Marked.',
    href: '/legal/terms',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    title: 'Privacy Policy',
    description: 'Learn how we collect, use, and protect your data.',
    href: '/legal/privacy',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: 'Cookie Policy',
    description: 'Information about how we use cookies.',
    href: '/legal/cookies',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export default function LegalPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Legal Documents</h2>
        <div className="space-y-3">
          {legalLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              target="_blank"
              className="flex items-start gap-4 p-4 rounded-lg border border-border hover:border-border-hover hover:bg-hover transition-colors"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary-light">
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground">{item.title}</h3>
                <p className="text-sm text-foreground-muted mt-0.5">{item.description}</p>
              </div>
              <svg className="w-5 h-5 text-foreground-faint flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Contact</h2>
        <p className="text-sm text-foreground-muted mb-4">
          For legal inquiries or questions about our policies, please contact us.
        </p>
        <a
          href="mailto:legal@marked.app"
          className="inline-flex items-center gap-2 text-sm text-primary-light hover:text-primary-dark transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          legal@marked.app
        </a>
      </div>
    </div>
  );
}
