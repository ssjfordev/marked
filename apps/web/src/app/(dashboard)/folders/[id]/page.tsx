import { FolderView } from './FolderView';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function FolderPage({ params }: PageProps) {
  const { id } = await params;
  return <FolderView folderId={id} />;
}
