import Link from 'next/link';
import { getUser } from '@/lib/auth/actions';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const user = await getUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="max-w-2xl space-y-8 text-center">
        <h1 className="text-4xl font-bold">Marked</h1>
        <p className="text-xl text-gray-600">링크를 저장하는 게 아니라, 지식으로 정리합니다.</p>
        <p className="text-gray-500">
          웹에서 찾은 정보를 &apos;내 자산 페이지&apos;로 전환하는 링크 워크스페이스
        </p>

        <div className="flex justify-center gap-4">
          <Link
            href="/login"
            className="rounded-lg bg-black px-6 py-3 text-white transition-colors hover:bg-gray-800"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
}
