import Image from 'next/image';
import Link from 'next/link';
import { getUser } from '@/lib/auth/actions';
import { HeroInteractive } from '@/components/landing/HeroInteractive';

export default async function HomePage() {
  const user = await getUser();

  return (
    <div className="min-h-screen bg-bg text-foreground overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/dashboard" className="hover:opacity-80 transition-opacity">
            <Image
              src="/logos/marked-logo-full.png"
              alt="Marked"
              width={120}
              height={30}
              unoptimized
              className="dark:hidden h-7 w-auto"
            />
            <Image
              src="/logos/marked-logo-full-white.png"
              alt="Marked"
              width={120}
              height={30}
              unoptimized
              className="hidden dark:block h-7 w-auto"
            />
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-primary-dark hover:shadow-lg hover:shadow-primary/20"
              >
                대시보드로 이동
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-foreground-secondary hover:text-foreground transition-colors"
                >
                  로그인
                </Link>
                <Link
                  href="/login"
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-primary-dark hover:shadow-lg hover:shadow-primary/20"
                >
                  무료로 시작하기
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-40 pb-24 px-6">
        {/* Ambient gradient orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute top-16 left-1/2 w-[900px] h-[600px] rounded-full blur-[140px]"
            style={{
              background: 'radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)',
              animation: 'heroOrbDrift1 12s ease-in-out infinite',
            }}
          />
          <div
            className="absolute -top-20 right-[10%] w-[500px] h-[500px] rounded-full blur-[120px]"
            style={{
              background: 'radial-gradient(circle, rgba(5,150,105,0.05) 0%, transparent 70%)',
              animation: 'heroOrbDrift2 16s ease-in-out infinite',
            }}
          />
        </div>

        {/* Interactive dot grid + mouse spotlight + click ripple */}
        <HeroInteractive />

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 mb-8 hero-fade-up hero-delay-1">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-medium text-primary-light tracking-wide">
              Chrome 확장 지원
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
            <span className="hero-fade-up hero-delay-2 block">흩어진 링크,</span>
            <span className="hero-fade-up hero-delay-3 block text-primary-light">
              한곳에서 관리하세요
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg sm:text-xl text-foreground-muted leading-relaxed mb-10 hero-fade-up hero-delay-4">
            웹에서 찾은 정보를 나만의 워크스페이스에 모으세요.
            <br className="hidden sm:block" />
            폴더, 태그, 하이라이트, 메모 — 북마크의 새로운 기준.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 hero-fade-up hero-delay-5">
            <Link
              href={user ? '/dashboard' : '/login'}
              className="hero-shimmer-btn hero-cta-glow group relative rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-white transition-all hover:bg-primary-dark hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-0.5"
            >
              {user ? '대시보드로 이동' : '무료로 시작하기'}
              <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">
                &rarr;
              </span>
            </Link>
            <a
              href="https://chromewebstore.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl border border-border px-6 py-3.5 text-base font-medium text-foreground-secondary transition-all hover:border-primary/30 hover:bg-surface-hover"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
                <path d="M21.17 8H12" stroke="currentColor" strokeWidth="1.5" />
                <path d="M3.95 6.06L8.54 14" stroke="currentColor" strokeWidth="1.5" />
                <path d="M10.88 21.94L15.46 14" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              Chrome 확장 프로그램
            </a>
          </div>
        </div>
      </section>

      {/* Browser mockup */}
      <section className="relative px-6 pb-24">
        {/* Glow behind mockup */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-32 bg-primary/[0.04] blur-[80px] rounded-full" />
        <div className="mx-auto max-w-5xl hero-fade-up hero-delay-5">
          <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-2xl shadow-black/20 ring-1 ring-primary/[0.05]">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-foreground-faint/30" />
                <div className="h-3 w-3 rounded-full bg-foreground-faint/30" />
                <div className="h-3 w-3 rounded-full bg-foreground-faint/30" />
              </div>
              <div className="ml-4 flex-1 rounded-md bg-surface-hover px-4 py-1.5 text-xs text-foreground-faint">
                marked.so/dashboard
              </div>
            </div>
            {/* Dashboard preview */}
            <div className="flex">
              {/* Sidebar */}
              <div className="hidden md:block w-56 border-r border-border p-4 space-y-3">
                <div className="flex items-center gap-2 mb-6">
                  <div className="h-6 w-6 rounded-md bg-primary/20" />
                  <div className="h-3 w-20 rounded bg-foreground-faint/20" />
                </div>
                {['전체 링크', '즐겨찾기', '폴더 관리'].map((item, i) => (
                  <div
                    key={item}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs ${i === 0 ? 'bg-primary/10 text-primary-light' : 'text-foreground-muted'}`}
                  >
                    <div
                      className={`h-4 w-4 rounded ${i === 0 ? 'bg-primary/30' : 'bg-foreground-faint/20'}`}
                    />
                    {item}
                  </div>
                ))}
                <div className="pt-3 border-t border-border mt-3">
                  <div className="text-[10px] font-semibold text-foreground-faint uppercase tracking-widest mb-2 px-3">
                    폴더
                  </div>
                  {['개발 리소스', '디자인 참고', 'AI 도구'].map((folder) => (
                    <div
                      key={folder}
                      className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-foreground-muted"
                    >
                      <span className="text-sm">📁</span>
                      {folder}
                    </div>
                  ))}
                </div>
              </div>
              {/* Content */}
              <div className="flex-1 p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    {
                      title: 'React 19 Release Notes',
                      domain: 'react.dev',
                      color: 'bg-sky-500/10',
                    },
                    {
                      title: 'Tailwind v4 Migration Guide',
                      domain: 'tailwindcss.com',
                      color: 'bg-teal-500/10',
                    },
                    {
                      title: 'System Design Interview',
                      domain: 'github.com',
                      color: 'bg-violet-500/10',
                    },
                    {
                      title: 'Supabase Auth Best Practices',
                      domain: 'supabase.com',
                      color: 'bg-emerald-500/10',
                    },
                    {
                      title: 'Figma Auto Layout Tips',
                      domain: 'figma.com',
                      color: 'bg-orange-500/10',
                    },
                    {
                      title: 'TypeScript 5.8 발표',
                      domain: 'devblogs.microsoft.com',
                      color: 'bg-blue-500/10',
                    },
                  ].map((card) => (
                    <div
                      key={card.title}
                      className="rounded-lg border border-border overflow-hidden"
                    >
                      <div className={`h-20 ${card.color}`} />
                      <div className="p-3">
                        <div className="text-xs font-medium text-foreground truncate">
                          {card.title}
                        </div>
                        <div className="text-[10px] text-foreground-faint mt-1">{card.domain}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-24 border-t border-border">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              북마크 관리,
              <br className="sm:hidden" /> 이렇게 달라집니다
            </h2>
            <p className="text-foreground-muted text-lg max-w-xl mx-auto">
              저장만 하고 다시 찾지 못하는 북마크는 그만.
              <br />
              Marked로 깔끔하게 정리하세요.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
                    />
                  </svg>
                ),
                title: '폴더 & 태그 정리',
                desc: '계층형 폴더와 유연한 태그로 링크를 체계적으로 분류하세요. 드래그 앤 드롭으로 간편하게 정리합니다.',
              },
              {
                icon: (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
                    />
                  </svg>
                ),
                title: '빠른 검색',
                desc: '제목, 태그, 도메인으로 저장한 링크를 빠르게 찾으세요. 원하는 링크를 바로 꺼내 쓸 수 있습니다.',
              },
              {
                icon: (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.764m3.42 3.42a6.776 6.776 0 00-3.42-3.42"
                    />
                  </svg>
                ),
                title: '하이라이트 & 메모',
                desc: '중요한 내용을 하이라이트하고 메모를 남기세요. 링크를 다시 열지 않아도 핵심을 바로 확인할 수 있습니다.',
              },
              {
                icon: (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z"
                    />
                  </svg>
                ),
                title: 'Chrome 확장 프로그램',
                desc: '클릭 한 번으로 현재 페이지를 저장. 폴더 선택, 태그 입력, 메모까지 브라우저에서 바로 완료합니다.',
              },
              {
                icon: (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
                    />
                  </svg>
                ),
                title: '폴더 공유',
                desc: '큐레이션한 링크 모음을 공개 URL로 공유하세요. 팀원, 동료, 커뮤니티와 지식을 나눌 수 있습니다.',
              },
              {
                icon: (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                    />
                  </svg>
                ),
                title: '간편한 가져오기',
                desc: 'Chrome, Safari, Firefox, Raindrop 등 기존 북마크를 그대로 가져옵니다. 폴더 구조까지 유지됩니다.',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="group rounded-xl border border-border p-6 transition-all hover:border-primary/20 hover:bg-surface-hover"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary-light transition-colors group-hover:bg-primary/15">
                  {f.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-foreground-muted leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 py-24 border-t border-border">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">심플한 요금제</h2>
            <p className="text-foreground-muted text-lg">
              기본 기능은 무료. 더 강력한 도구가 필요할 때 Pro로 업그레이드하세요.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Free */}
            <div className="rounded-xl border border-border p-8">
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-1">Free</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">₩0</span>
                  <span className="text-foreground-muted text-sm">/월</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  '무제한 링크 & 폴더 저장',
                  '태그 & 즐겨찾기',
                  'Chrome 확장 프로그램',
                  '키워드 검색',
                  '북마크 가져오기/내보내기',
                  '폴더 공유 링크',
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-sm text-foreground-secondary"
                  >
                    <svg
                      className="w-4 h-4 text-primary-light mt-0.5 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/login"
                className="block w-full rounded-lg border border-border py-2.5 text-center text-sm font-semibold text-foreground transition-colors hover:bg-surface-hover"
              >
                무료로 시작하기
              </Link>
            </div>

            {/* Pro */}
            <div className="relative rounded-xl border-2 border-primary/40 p-8 bg-primary/[0.03]">
              <div className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-0.5 text-xs font-bold text-white">
                추천
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-1">Pro</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">₩2,500</span>
                  <span className="text-foreground-muted text-sm">/월</span>
                </div>
                <p className="text-xs text-foreground-faint mt-1">
                  연간 결제 시 ₩19,000/년 (약 17% 할인)
                </p>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  'Free의 모든 기능 포함',
                  '고급 검색 기능',
                  '링크별 메모 작성',
                  '에셋 페이지 (상세 뷰)',
                  '우선 지원',
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-sm text-foreground-secondary"
                  >
                    <svg
                      className="w-4 h-4 text-primary-light mt-0.5 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/login"
                className="block w-full rounded-lg bg-primary py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
              >
                Pro 시작하기
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 border-t border-border">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">지금 시작하세요</h2>
          <p className="text-foreground-muted text-lg mb-8">
            무료 플랜으로 바로 사용할 수 있습니다.
            <br />
            기존 북마크도 그대로 가져올 수 있어요.
          </p>
          <Link
            href={user ? '/dashboard' : '/login'}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-white transition-all hover:bg-primary-dark hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-0.5"
          >
            {user ? '대시보드로 이동' : '무료로 시작하기'}
            <span>&rarr;</span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Image
              src="/logos/marked-logo-full.png"
              alt="Marked"
              width={80}
              height={20}
              unoptimized
              className="dark:hidden h-5 w-auto"
            />
            <Image
              src="/logos/marked-logo-full-white.png"
              alt="Marked"
              width={80}
              height={20}
              unoptimized
              className="hidden dark:block h-5 w-auto"
            />
            <span className="text-xs text-foreground-faint">
              &copy; {new Date().getFullYear()} Marked
            </span>
          </div>
          <div className="flex items-center gap-6 text-xs text-foreground-muted">
            <Link href="/settings/legal" className="hover:text-foreground transition-colors">
              이용약관
            </Link>
            <Link href="/settings/legal" className="hover:text-foreground transition-colors">
              개인정보처리방침
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
