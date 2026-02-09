import { AssetPageView } from './AssetPageView';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AssetPage({ params }: PageProps) {
  const { id } = await params;
  return <AssetPageView shortId={id} />;
}
