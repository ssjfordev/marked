import { requireUser } from '@/lib/auth/actions';
import { createClient } from '@/lib/supabase/server';
import { signOut } from '@/lib/auth/actions';

type SubscriptionData = {
  plan: 'free' | 'pro' | 'ai_pro';
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data } = await supabase
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', user.id)
    .maybeSingle();

  const subscription = data as SubscriptionData | null;
  const plan = subscription?.plan ?? 'free';
  const status = subscription?.status ?? 'active';

  return (
    <div className="flex min-h-screen">
      {/* Sidebar placeholder */}
      <aside className="w-64 border-r border-gray-200 bg-gray-50 p-4">
        <div className="mb-8">
          <h1 className="text-xl font-bold">Marked</h1>
        </div>

        {/* Folder tree will go here */}
        <nav className="space-y-2">
          <p className="text-sm text-gray-500">Folders will appear here</p>
        </nav>

        <div className="absolute bottom-4 left-4 right-4 max-w-56">
          <div className="mb-2 truncate text-sm text-gray-600">{user.email}</div>
          <div className="mb-2 text-xs text-gray-400">
            Plan: {plan} ({status})
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
