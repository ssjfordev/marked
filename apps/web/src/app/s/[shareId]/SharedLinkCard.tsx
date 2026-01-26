'use client';

import { useState } from 'react';

interface SharedLinkCardProps {
  link: {
    id: string;
    url: string;
    domain: string;
    title: string;
    description: string | null;
    ogImage: string | null;
    favicon: string | null;
  };
}

export function SharedLinkCard({ link }: SharedLinkCardProps) {
  const [ogImageError, setOgImageError] = useState(false);
  const [faviconError, setFaviconError] = useState(false);

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-xl border border-border bg-surface hover:border-primary/30 hover:shadow-lg transition-all duration-200 overflow-hidden"
    >
      {/* OG Image */}
      {link.ogImage && !ogImageError && (
        <div className="aspect-[1.91/1] bg-surface-hover overflow-hidden">
          <img
            src={link.ogImage}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setOgImageError(true)}
          />
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* Favicon + Domain */}
        <div className="flex items-center gap-2 mb-2">
          {link.favicon && !faviconError ? (
            <img
              src={link.favicon}
              alt=""
              className="w-4 h-4 rounded"
              onError={() => setFaviconError(true)}
            />
          ) : (
            <div className="w-4 h-4 rounded bg-foreground-faint/20 flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-foreground-faint" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
          )}
          <span className="text-xs text-foreground-faint truncate">{link.domain}</span>
        </div>

        {/* Title */}
        <h3 className="font-medium text-foreground group-hover:text-primary-light transition-colors line-clamp-2 mb-1">
          {link.title}
        </h3>

        {/* Description */}
        {link.description && (
          <p className="text-sm text-foreground-muted line-clamp-2">
            {link.description}
          </p>
        )}
      </div>
    </a>
  );
}
