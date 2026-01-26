'use client';

import { useState, useEffect } from 'react';
import { LinkList } from '@/components/LinkList';
import { useRouter } from 'next/navigation';

interface LinkCanonical {
  id: string;
  url_key: string;
  original_url: string;
  domain: string;
  title: string | null;
  description: string | null;
  og_image: string | null;
  favicon: string | null;
}

interface LinkInstance {
  id: string;
  user_title: string | null;
  user_description: string | null;
  position: number;
  is_favorite: boolean;
  created_at: string;
  canonical: LinkCanonical;
  tags: { id: string; name: string }[];
}

interface AllLinksProps {
  links: LinkInstance[];
}

export function AllLinks({ links: initialLinks }: AllLinksProps) {
  const router = useRouter();
  const [view, setView] = useState<'list' | 'card'>('list');
  const [links, setLinks] = useState(initialLinks);

  // Sync with server data when it changes
  useEffect(() => {
    setLinks(initialLinks);
  }, [initialLinks]);

  const handleOpenLink = (link: LinkInstance) => {
    router.push(`/links/${link.canonical.id}`);
  };

  const handleDeleteLink = async (linkId: string) => {
    const previousLinks = links;
    setLinks((currentLinks) => currentLinks.filter((l) => l.id !== linkId));

    try {
      const response = await fetch(`/api/v1/links/${linkId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        setLinks(previousLinks);
      }
    } catch (error) {
      console.error('Failed to delete link:', error);
      setLinks(previousLinks);
    }
  };

  const handleToggleFavorite = async (linkId: string) => {
    // Optimistic update
    setLinks((currentLinks) =>
      currentLinks.map((l) =>
        l.id === linkId ? { ...l, is_favorite: !l.is_favorite } : l
      )
    );

    try {
      const response = await fetch(`/api/v1/links/${linkId}/favorite`, {
        method: 'PUT',
      });

      if (!response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      router.refresh();
    }
  };

  const handleAddTag = async (linkId: string, tagName: string) => {
    const tempId = `temp-${Date.now()}`;
    const previousLinks = links;

    setLinks((currentLinks) =>
      currentLinks.map((link) =>
        link.id === linkId
          ? { ...link, tags: [...link.tags, { id: tempId, name: tagName }] }
          : link
      )
    );

    try {
      const response = await fetch(`/api/v1/links/${linkId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tagName }),
      });

      if (response.ok) {
        router.refresh();
      } else {
        setLinks(previousLinks);
      }
    } catch (error) {
      console.error('Failed to add tag:', error);
      setLinks(previousLinks);
    }
  };

  const handleRemoveTag = async (linkId: string, tagId: string) => {
    const previousLinks = links;

    setLinks((currentLinks) =>
      currentLinks.map((link) =>
        link.id === linkId
          ? { ...link, tags: link.tags.filter((t) => t.id !== tagId) }
          : link
      )
    );

    try {
      const response = await fetch(`/api/v1/links/${linkId}/tags/${tagId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        setLinks(previousLinks);
      }
    } catch (error) {
      console.error('Failed to remove tag:', error);
      setLinks(previousLinks);
    }
  };

  return (
    <div>
      {/* View toggle */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-foreground-muted">{links.length} links</span>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
          <button
            onClick={() => setView('list')}
            className={`rounded-md p-1.5 transition-colors ${
              view === 'list'
                ? 'bg-surface-hover text-foreground'
                : 'text-foreground-muted hover:text-foreground'
            }`}
            title="List view"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <button
            onClick={() => setView('card')}
            className={`rounded-md p-1.5 transition-colors ${
              view === 'card'
                ? 'bg-surface-hover text-foreground'
                : 'text-foreground-muted hover:text-foreground'
            }`}
            title="Card view"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
        </div>
      </div>

      <LinkList
        links={links}
        view={view}
        onOpenLink={handleOpenLink}
        onDeleteLink={handleDeleteLink}
        onToggleFavorite={handleToggleFavorite}
        onAddTag={handleAddTag}
        onRemoveTag={handleRemoveTag}
      />
    </div>
  );
}
