import Image from 'next/image';
import { createServiceClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { SharedLinkCard } from './SharedLinkCard';

interface PageProps {
  params: Promise<{ shareId: string }>;
}

interface SharedLink {
  id: string;
  url: string;
  domain: string;
  title: string;
  description: string | null;
  ogImage: string | null;
  favicon: string | null;
}

export default async function SharedFolderPage({ params }: PageProps) {
  const { shareId } = await params;
  const supabase = createServiceClient();

  // Get folder by share_id
  const { data: folder } = await supabase
    .from('folders')
    .select('id, name, icon, description, user_id')
    .eq('share_id', shareId)
    .single();

  if (!folder) {
    notFound();
  }

  // Get link instances
  const { data: instances } = await supabase
    .from('link_instances')
    .select('id, user_title, user_description, position, link_canonical_id')
    .eq('folder_id', folder.id)
    .order('position');

  // Get canonicals
  const canonicalIds = instances?.map((i) => i.link_canonical_id) ?? [];
  const { data: canonicals } =
    canonicalIds.length > 0
      ? await supabase
          .from('link_canonicals')
          .select('id, original_url, domain, title, description, og_image, favicon')
          .in('id', canonicalIds)
      : { data: [] };

  const canonicalMap = new Map(canonicals?.map((c) => [c.id, c]) ?? []);

  const links: SharedLink[] = (instances ?? [])
    .map((instance) => {
      const canonical = canonicalMap.get(instance.link_canonical_id);
      if (!canonical) return null;
      return {
        id: instance.id,
        url: canonical.original_url,
        domain: canonical.domain,
        title: instance.user_title || canonical.title || canonical.original_url,
        description: instance.user_description || canonical.description,
        ogImage: canonical.og_image,
        favicon: canonical.favicon,
      };
    })
    .filter((l): l is SharedLink => l !== null);

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="border-b border-border bg-surface">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center gap-4">
            {folder.icon ? (
              <span className="text-5xl">{folder.icon}</span>
            ) : (
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <svg
                  className="w-7 h-7 text-primary-light"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-semibold text-foreground">{folder.name}</h1>
              <p className="text-sm text-foreground-muted mt-1">
                {links.length} {links.length === 1 ? 'link' : 'links'}
              </p>
              {folder.description && (
                <p className="text-sm text-foreground-muted mt-2">{folder.description}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Links Grid */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {links.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-foreground-muted">No links in this folder yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {links.map((link) => (
              <SharedLinkCard key={link.id} link={link} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-auto">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-center">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground transition-colors"
          >
            <span>Powered by</span>
            <Image
              src="/logos/marked-logo-full.png"
              alt="Marked"
              width={72}
              height={18}
              unoptimized
              className="dark:hidden h-4 w-auto"
            />
            <Image
              src="/logos/marked-logo-full-white.png"
              alt="Marked"
              width={72}
              height={18}
              unoptimized
              className="hidden dark:block h-4 w-auto"
            />
          </Link>
        </div>
      </footer>
    </div>
  );
}
