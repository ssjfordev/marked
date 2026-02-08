'use client';

import { useState, useMemo } from 'react';

const FALLBACK_THUMBNAILS = [
  '/images/fallback-thumbnails/waves.png',
  '/images/fallback-thumbnails/bubbles.png',
  '/images/fallback-thumbnails/lines.png',
  '/images/fallback-thumbnails/dots.png',
  '/images/fallback-thumbnails/geometric.png',
  '/images/fallback-thumbnails/gradient.png',
];

function getFallbackThumbnail(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  return FALLBACK_THUMBNAILS[Math.abs(hash) % FALLBACK_THUMBNAILS.length];
}

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
  const fallbackThumbnail = useMemo(
    () => getFallbackThumbnail(link.title + link.domain),
    [link.title, link.domain]
  );
  const [thumbnailSrc, setThumbnailSrc] = useState(link.ogImage || fallbackThumbnail);
  const [faviconSrc, setFaviconSrc] = useState(
    link.favicon || `https://www.google.com/s2/favicons?domain=${link.domain}&sz=32`
  );
  const [faviconError, setFaviconError] = useState(false);

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-xl border border-border bg-surface hover:border-primary/30 hover:shadow-lg transition-all duration-200 overflow-hidden"
    >
      {/* Thumbnail (always shown — fallback if missing or broken) */}
      <div className="aspect-[1.91/1] bg-surface-hover overflow-hidden">
        <img
          src={thumbnailSrc}
          alt=""
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={() => {
            if (thumbnailSrc !== fallbackThumbnail) {
              setThumbnailSrc(fallbackThumbnail);
            }
          }}
        />
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Favicon + Domain */}
        <div className="flex items-center gap-2 mb-2">
          {faviconSrc && !faviconError ? (
            <img
              src={faviconSrc}
              alt=""
              className="w-4 h-4 rounded"
              onError={() => {
                const googleFallback = `https://www.google.com/s2/favicons?domain=${link.domain}&sz=32`;
                if (faviconSrc !== googleFallback) {
                  setFaviconSrc(googleFallback);
                } else {
                  setFaviconError(true);
                }
              }}
            />
          ) : (
            <div className="w-4 h-4 rounded bg-foreground-faint/20 flex items-center justify-center">
              <svg
                className="w-2.5 h-2.5 text-foreground-faint"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
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
          <p className="text-sm text-foreground-muted line-clamp-2">{link.description}</p>
        )}
      </div>
    </a>
  );
}
