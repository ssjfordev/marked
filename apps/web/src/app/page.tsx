import Link from 'next/link';
import { getUser } from '@/lib/auth/actions';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const user = await getUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-bg">
      <div className="max-w-2xl space-y-8 text-center">
        {/* Logo */}
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-foreground">Marked</h1>
        <p className="text-xl text-foreground-secondary">링크를 저장하는 게 아니라, 지식으로 정리합니다.</p>
        <p className="text-foreground-muted">
          웹에서 찾은 정보를 &apos;내 자산 페이지&apos;로 전환하는 링크 워크스페이스
        </p>

        <div className="flex justify-center gap-4">
          <Link
            href="/login"
            className="rounded-lg bg-primary px-6 py-3 text-white font-medium transition-colors hover:bg-primary-dark"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
}
