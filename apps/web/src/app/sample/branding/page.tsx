'use client';

import { useState } from 'react';

type BrandingOption = 'classic' | 'split' | 'cards' | 'dashboard';

const PRIMARY = '#059669';
const PRIMARY_LIGHT = '#10B981';
// const PRIMARY_DARK = '#047857'; // Reserved for future use

export default function BrandingShowcase() {
  const [activeTab, setActiveTab] = useState<BrandingOption>('classic');

  const tabs: { id: BrandingOption; label: string }[] = [
    { id: 'classic', label: 'Classic' },
    { id: 'split', label: 'Split' },
    { id: 'cards', label: 'Cards' },
    { id: 'dashboard', label: 'Dashboard' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f0d]">
      {/* Tab Navigation */}
      <nav className="fixed top-0 right-0 left-0 z-50 border-b border-white/10 bg-[#0a0f0d]/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PRIMARY }} />
              <span className="text-sm font-medium text-white/50">Forest Green Branding</span>
            </div>
            <div className="flex gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-white/10 text-white'
                      : 'text-white/40 hover:bg-white/5 hover:text-white/70'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-[65px]">
        {activeTab === 'classic' && <ClassicLayout />}
        {activeTab === 'split' && <SplitLayout />}
        {activeTab === 'cards' && <CardsLayout />}
        {activeTab === 'dashboard' && <DashboardLayout />}
      </main>
    </div>
  );
}

/* ============================================
   LAYOUT 1: CLASSIC
   중앙 정렬, 깔끔한 계층 구조
   ============================================ */
function ClassicLayout() {
  return (
    <div className="relative min-h-screen bg-[#0a0f0d] font-[family-name:var(--font-dm-sans)]">
      <div className="absolute inset-0">
        <div
          className="absolute top-0 left-1/2 h-[600px] w-[800px] -translate-x-1/2 opacity-15 blur-[120px]"
          style={{ background: `radial-gradient(ellipse, ${PRIMARY} 0%, transparent 70%)` }}
        />
      </div>

      <div className="relative mx-auto max-w-5xl px-6 py-24">
        {/* Header */}
        <div className="mb-20 text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PRIMARY }} />
            <span className="text-sm text-white/60">지식 관리의 새로운 방법</span>
          </div>

          <h1 className="mb-6 text-4xl leading-tight font-bold tracking-tight text-white md:text-6xl">
            링크를 저장하는 게 아니라,
            <br />
            <span style={{ color: PRIMARY_LIGHT }}>지식으로 정리합니다</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-white/50">
            웹에서 찾은 정보를 체계적으로 정리하고, 필요할 때 바로 찾아 활용하세요.
          </p>

          <div className="flex justify-center gap-4">
            <button
              className="rounded-lg px-8 py-3.5 text-base font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: PRIMARY }}
            >
              무료로 시작하기
            </button>
            <button className="rounded-lg border border-white/20 px-8 py-3.5 text-base font-medium text-white transition-colors hover:bg-white/5">
              자세히 보기
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              num: '01',
              title: '스마트 저장',
              desc: '링크를 저장하면 제목, 설명, 이미지를 자동으로 추출합니다',
            },
            {
              num: '02',
              title: '폴더 & 태그',
              desc: '계층형 폴더와 태그로 나만의 분류 체계를 만드세요',
            },
            {
              num: '03',
              title: '빠른 검색',
              desc: '저장한 모든 콘텐츠를 키워드로 즉시 찾아냅니다',
            },
          ].map((item) => (
            <div
              key={item.num}
              className="group rounded-xl border border-white/10 bg-white/[0.02] p-6 transition-colors hover:border-white/20"
            >
              <div className="mb-4 text-sm font-mono font-medium" style={{ color: PRIMARY_LIGHT }}>
                {item.num}
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">{item.title}</h3>
              <p className="text-sm leading-relaxed text-white/40">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Bottom Stats */}
        <div className="mt-16 flex justify-center gap-12 border-t border-white/10 pt-12">
          {[
            { value: '10,000+', label: '저장된 링크' },
            { value: '2,000+', label: '활성 사용자' },
            { value: '99.9%', label: '서비스 안정성' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-white/40">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================
   LAYOUT 2: SPLIT
   좌우 분할, 시각적 균형
   ============================================ */
function SplitLayout() {
  return (
    <div className="relative min-h-screen bg-[#0a0f0d] font-[family-name:var(--font-dm-sans)]">
      <div className="relative mx-auto max-w-7xl px-6 py-24">
        <div className="grid min-h-[80vh] items-center gap-16 lg:grid-cols-2">
          {/* Left: Content */}
          <div>
            <div
              className="mb-6 inline-block rounded-md px-3 py-1 text-sm font-medium"
              style={{ backgroundColor: `${PRIMARY}20`, color: PRIMARY_LIGHT }}
            >
              Knowledge Workspace
            </div>

            <h1 className="mb-6 text-4xl leading-tight font-bold tracking-tight text-white md:text-5xl">
              흩어진 정보를
              <br />
              <span style={{ color: PRIMARY_LIGHT }}>체계적으로 정리</span>하세요
            </h1>

            <p className="mb-8 max-w-md text-lg leading-relaxed text-white/50">
              링크를 저장하는 게 아니라, 지식으로 정리합니다. 웹에서 찾은 정보를 나만의
              워크스페이스에서 관리하세요.
            </p>

            <div className="mb-10 space-y-4">
              {['메타데이터 자동 추출', '폴더 & 태그 분류 시스템', '전문 검색 기능'].map(
                (feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <div
                      className="flex h-5 w-5 items-center justify-center rounded-full"
                      style={{ backgroundColor: PRIMARY }}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path
                          d="M2.5 6L5 8.5L9.5 4"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <span className="text-white/70">{feature}</span>
                  </div>
                )
              )}
            </div>

            <button
              className="rounded-lg px-8 py-3.5 text-base font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: PRIMARY }}
            >
              무료로 시작하기
            </button>
          </div>

          {/* Right: Visual */}
          <div className="relative">
            <div
              className="absolute -inset-4 rounded-2xl opacity-20 blur-2xl"
              style={{ background: PRIMARY }}
            />
            <div className="relative rounded-2xl border border-white/10 bg-[#0d1210] p-6">
              {/* Mock folder structure */}
              <div className="mb-4 flex items-center gap-2 border-b border-white/10 pb-4">
                <div className="h-3 w-3 rounded-full bg-white/20" />
                <div className="h-3 w-3 rounded-full bg-white/20" />
                <div className="h-3 w-3 rounded-full bg-white/20" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded"
                    style={{ backgroundColor: `${PRIMARY}30` }}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill={PRIMARY_LIGHT}>
                      <path d="M2 4a2 2 0 012-2h3l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V4z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">개발 리소스</div>
                    <div className="text-xs text-white/40">24개 링크</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-white/5">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-white/10">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="white" fillOpacity="0.4">
                      <path d="M2 4a2 2 0 012-2h3l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V4z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white/70">디자인 영감</div>
                    <div className="text-xs text-white/40">18개 링크</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-white/5">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-white/10">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="white" fillOpacity="0.4">
                      <path d="M2 4a2 2 0 012-2h3l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V4z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white/70">읽을거리</div>
                    <div className="text-xs text-white/40">32개 링크</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 border-t border-white/10 pt-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/30">태그:</span>
                  {['React', 'TypeScript', 'Design'].map((tag) => (
                    <span
                      key={tag}
                      className="rounded px-2 py-0.5 text-xs"
                      style={{ backgroundColor: `${PRIMARY}20`, color: PRIMARY_LIGHT }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================
   LAYOUT 3: CARDS
   카드 중심, 정돈된 그리드
   ============================================ */
function CardsLayout() {
  return (
    <div className="relative min-h-screen bg-[#0a0f0d] font-[family-name:var(--font-dm-sans)]">
      <div className="relative mx-auto max-w-6xl px-6 py-24">
        {/* Header */}
        <div className="mb-16 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: PRIMARY }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
                <path
                  d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-2xl font-semibold text-white">Marked</span>
          </div>
          <h1 className="mb-4 text-3xl font-bold text-white md:text-5xl">
            지식 정리, <span style={{ color: PRIMARY_LIGHT }}>더 쉽게</span>
          </h1>
          <p className="mx-auto max-w-xl text-white/50">
            링크를 저장하는 게 아니라, 지식으로 정리합니다
          </p>
        </div>

        {/* Main Cards Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Feature Card 1 */}
          <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent p-6">
            <div
              className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${PRIMARY}20` }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke={PRIMARY_LIGHT}
                strokeWidth="2"
              >
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-white">원클릭 저장</h3>
            <p className="text-sm leading-relaxed text-white/40">
              브라우저 익스텐션으로 보고 있는 페이지를 바로 저장하세요
            </p>
          </div>

          {/* Feature Card 2 */}
          <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent p-6">
            <div
              className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${PRIMARY}20` }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke={PRIMARY_LIGHT}
                strokeWidth="2"
              >
                <path
                  d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-white">스마트 분류</h3>
            <p className="text-sm leading-relaxed text-white/40">
              폴더와 태그로 체계적인 분류 시스템을 구축하세요
            </p>
          </div>

          {/* Feature Card 3 */}
          <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent p-6">
            <div
              className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${PRIMARY}20` }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke={PRIMARY_LIGHT}
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-white">즉시 검색</h3>
            <p className="text-sm leading-relaxed text-white/40">
              저장한 모든 콘텐츠를 키워드로 빠르게 찾아보세요
            </p>
          </div>

          {/* CTA Card - spans 2 columns */}
          <div
            className="flex flex-col justify-between rounded-2xl p-6 md:col-span-2 lg:col-span-2"
            style={{ backgroundColor: PRIMARY }}
          >
            <div>
              <h3 className="mb-2 text-xl font-bold text-white">지금 바로 시작하세요</h3>
              <p className="mb-6 text-white/80">
                무료로 시작하고, 필요할 때 업그레이드하세요. 신용카드가 필요 없습니다.
              </p>
            </div>
            <div className="flex gap-3">
              <button className="rounded-lg bg-white px-6 py-2.5 font-semibold text-gray-900 transition-opacity hover:opacity-90">
                무료로 시작
              </button>
              <button className="rounded-lg border border-white/30 px-6 py-2.5 font-medium text-white transition-colors hover:bg-white/10">
                데모 보기
              </button>
            </div>
          </div>

          {/* Stats Card */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <div className="space-y-4">
              {[
                { label: '저장된 링크', value: '50,000+' },
                { label: '활성 사용자', value: '2,000+' },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between">
                  <span className="text-white/40">{stat.label}</span>
                  <span className="font-semibold text-white">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================
   LAYOUT 4: DASHBOARD
   대시보드 프리뷰, 실제 사용 경험 강조
   ============================================ */
function DashboardLayout() {
  return (
    <div className="relative min-h-screen bg-[#0a0f0d] font-[family-name:var(--font-dm-sans)]">
      <div className="relative mx-auto max-w-7xl px-6 py-16">
        {/* Header */}
        <div className="mb-12 flex items-center justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ backgroundColor: PRIMARY }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white">
                  <path
                    d="M9 12L11 14L15 10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="text-lg font-semibold text-white">Marked</span>
            </div>
            <h1 className="text-2xl font-bold text-white md:text-3xl">
              당신의 지식을 <span style={{ color: PRIMARY_LIGHT }}>한눈에</span>
            </h1>
          </div>
          <button
            className="rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: PRIMARY }}
          >
            무료로 시작하기
          </button>
        </div>

        {/* Dashboard Preview */}
        <div className="rounded-2xl border border-white/10 bg-[#0d1210] p-1">
          {/* Browser Chrome */}
          <div className="flex items-center gap-2 rounded-t-xl bg-white/5 px-4 py-3">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-white/20" />
              <div className="h-3 w-3 rounded-full bg-white/20" />
              <div className="h-3 w-3 rounded-full bg-white/20" />
            </div>
            <div className="flex-1">
              <div className="mx-auto w-64 rounded-md bg-white/10 px-3 py-1.5 text-center text-xs text-white/40">
                app.marked.kr
              </div>
            </div>
          </div>

          {/* App Content */}
          <div className="flex min-h-[500px]">
            {/* Sidebar */}
            <div className="w-56 border-r border-white/10 p-4">
              <div className="mb-6">
                <div className="mb-2 text-xs font-medium tracking-wide text-white/30 uppercase">
                  폴더
                </div>
                <div className="space-y-1">
                  {[
                    { name: '개발', count: 24, active: true },
                    { name: '디자인', count: 18, active: false },
                    { name: '마케팅', count: 12, active: false },
                    { name: '읽을거리', count: 32, active: false },
                  ].map((folder) => (
                    <div
                      key={folder.name}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                        folder.active ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/5'
                      }`}
                    >
                      <span>{folder.name}</span>
                      <span className="text-xs text-white/30">{folder.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 text-xs font-medium tracking-wide text-white/30 uppercase">
                  태그
                </div>
                <div className="flex flex-wrap gap-1">
                  {['React', 'Next.js', 'TypeScript', 'UI/UX'].map((tag) => (
                    <span
                      key={tag}
                      className="rounded px-2 py-0.5 text-xs"
                      style={{ backgroundColor: `${PRIMARY}20`, color: PRIMARY_LIGHT }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">
                  개발 <span className="text-white/30 font-normal">(24)</span>
                </h2>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeOpacity="0.4"
                      strokeWidth="2"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
                    </svg>
                    <span className="text-sm text-white/40">검색...</span>
                  </div>
                </div>
              </div>

              {/* Link Cards */}
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  { title: 'Next.js 15 공식 문서', domain: 'nextjs.org', tag: 'Next.js' },
                  { title: 'React Server Components 가이드', domain: 'react.dev', tag: 'React' },
                  {
                    title: 'TypeScript 5.0 새로운 기능',
                    domain: 'typescriptlang.org',
                    tag: 'TypeScript',
                  },
                  { title: 'Tailwind CSS 베스트 프랙티스', domain: 'tailwindcss.com', tag: 'CSS' },
                ].map((link, i) => (
                  <div
                    key={i}
                    className="group flex items-start gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4 transition-colors hover:border-white/20"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-xs font-medium text-white/40">
                      {link.domain.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="mb-1 truncate font-medium text-white group-hover:text-white">
                        {link.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-white/40">
                        <span>{link.domain}</span>
                        <span>·</span>
                        <span style={{ color: PRIMARY_LIGHT }}>{link.tag}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Message */}
        <div className="mt-8 text-center">
          <p className="text-white/40">
            링크를 저장하는 게 아니라,{' '}
            <span style={{ color: PRIMARY_LIGHT }}>지식으로 정리합니다</span>
          </p>
        </div>
      </div>
    </div>
  );
}
