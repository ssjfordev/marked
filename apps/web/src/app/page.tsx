import Image from 'next/image';
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
        <Image
          src="/logos/marked-logo-full.png"
          alt="Marked"
          width={200}
          height={50}
          unoptimized
          className="dark:hidden h-12 w-auto mx-auto"
        />
        <Image
          src="/logos/marked-logo-full-white.png"
          alt="Marked"
          width={200}
          height={50}
          unoptimized
          className="hidden dark:block h-12 w-auto mx-auto"
        />
        <p className="text-xl text-foreground-secondary">
          링크를 저장하는 게 아니라, 지식으로 정리합니다.
        </p>
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
