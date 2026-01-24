import { requireUser } from '@/lib/auth/actions';

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Dashboard</h1>
      <p className="text-gray-600">Welcome, {user.email}</p>

      <div className="mt-8 rounded-lg border border-dashed border-gray-300 p-8 text-center">
        <p className="text-gray-500">Your links will appear here.</p>
        <p className="mt-2 text-sm text-gray-400">
          Import bookmarks or save links with the extension.
        </p>
      </div>
    </div>
  );
}
