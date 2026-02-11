'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { AssetPageClient } from './AssetPageClient';

interface AssetData {
  canonical: {
    id: string;
    url_key: string;
    original_url: string;
    domain: string;
    title: string | null;
    description: string | null;
    og_image: string | null;
    favicon: string | null;
  };
  instance: {
    id: string;
    user_title: string | null;
    user_description: string | null;
  };
  folder: { id: string; name: string } | null;
  tags: { id: string; name: string }[];
  marks: {
    id: string;
    text: string;
    color: string;
    note: string | null;
    position: number;
    created_at: string;
  }[];
  memo: {
    id: string;
    content: string;
    updated_at: string;
  } | null;
  hasAssetPageAccess: boolean;
  hasMemoAccess: boolean;
}

export function AssetPageView() {
  const { id: shortId } = useParams<{ id: string }>();
  const [data, setData] = useState<AssetData | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setNotFound(false);

    fetch(`/api/v1/links/detail/${shortId}`)
      .then((res) => {
        if (res.status === 404) {
          if (!cancelled) setNotFound(true);
          return null;
        }
        return res.json();
      })
      .then((json) => {
        if (!cancelled && json?.data) {
          setData(json.data);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch link detail:', err);
        if (!cancelled) setNotFound(true);
      });

    return () => {
      cancelled = true;
    };
  }, [shortId]);

  if (notFound) {
    return (
      <div className="max-w-5xl mx-auto text-center py-20">
        <h1 className="text-2xl font-semibold text-foreground mb-2">Link not found</h1>
        <p className="text-foreground-muted">
          This link doesn&apos;t exist or you don&apos;t have access.
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center py-20">
        <div className="h-6 w-6 border-2 border-foreground-muted border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AssetPageClient
      canonical={data.canonical}
      instance={data.instance}
      folder={data.folder}
      tags={data.tags}
      marks={data.marks}
      memo={data.memo}
      hasAssetPageAccess={data.hasAssetPageAccess}
      hasMemoAccess={data.hasMemoAccess}
    />
  );
}
