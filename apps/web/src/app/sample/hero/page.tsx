'use client';

import { useState } from 'react';

type Theme = 'dark' | 'light';

const PRIMARY = '#059669';
const PRIMARY_LIGHT = '#10B981';

export default function HeroPage() {
  const [theme, setTheme] = useState<Theme>('dark');

  const isDark = theme === 'dark';

  // Theme-aware colors
  const bg = isDark ? '#0a0f0d' : '#ffffff';
  const bgCard = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)';
  const bgCardHover = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
  const text = isDark ? '#ffffff' : '#111827';
  const textMuted = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
  const textFaint = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';
  const border = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  // const borderHover = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'; // Reserved for future use

  return (
    <div
      className="min-h-screen font-[family-name:var(--font-dm-sans)] transition-colors duration-300"
      style={{ backgroundColor: bg, color: text }}
    >
      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors"
          style={{
            backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            color: textMuted,
          }}
        >
          {isDark ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
              Light
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
              Dark
            </>
          )}
        </button>
      </div>

      {/* ========================================
          SECTION 1: HERO (Classic Style)
          ======================================== */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0">
          <div
            className="absolute top-0 left-1/2 h-[600px] w-[900px] -translate-x-1/2 blur-[120px] transition-opacity duration-300"
            style={{
              background: `radial-gradient(ellipse, ${PRIMARY} 0%, transparent 70%)`,
              opacity: isDark ? 0.15 : 0.08,
            }}
          />
        </div>

        <div className="relative mx-auto max-w-5xl px-6 pt-24 pb-16">
          {/* Badge */}
          <div className="mb-8 flex justify-center">
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors"
              style={{
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                border: `1px solid ${border}`,
              }}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PRIMARY }} />
              <span style={{ color: textMuted }}>지식 관리의 새로운 방법</span>
            </div>
          </div>

          {/* Headline */}
          <h1 className="mb-6 text-center text-4xl leading-tight font-bold tracking-tight md:text-6xl">
            링크를 저장하는 게 아니라,
            <br />
            <span style={{ color: PRIMARY_LIGHT }}>지식으로 정리합니다</span>
          </h1>

          <p
            className="mx-auto mb-10 max-w-2xl text-center text-lg leading-relaxed"
            style={{ color: textMuted }}
          >
            웹에서 찾은 정보를 체계적으로 정리하고, 필요할 때 바로 찾아 활용하세요.
            당신만의 지식 워크스페이스를 구축합니다.
          </p>

          {/* CTA Buttons */}
          <div className="flex justify-center gap-4">
            <button
              className="rounded-lg px-8 py-3.5 text-base font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: PRIMARY }}
            >
              무료로 시작하기
            </button>
            <button
              className="rounded-lg px-8 py-3.5 text-base font-medium transition-colors"
              style={{
                border: `1px solid ${border}`,
                color: text,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = bgCardHover)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              데모 보기
            </button>
          </div>
        </div>
      </section>

      {/* ========================================
          SECTION 2: APP PREVIEW (Dashboard Style)
          ======================================== */}
      <section className="relative px-6 pb-24">
        <div className="mx-auto max-w-5xl">
          <div
            className="rounded-2xl p-1 transition-colors"
            style={{ backgroundColor: isDark ? '#0d1210' : '#f8faf9', border: `1px solid ${border}` }}
          >
            {/* Browser Chrome */}
            <div
              className="flex items-center gap-2 rounded-t-xl px-4 py-3"
              style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}
            >
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }} />
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }} />
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }} />
              </div>
              <div className="flex-1">
                <div
                  className="mx-auto w-48 rounded-md px-3 py-1.5 text-center text-xs"
                  style={{
                    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                    color: textFaint,
                  }}
                >
                  app.marked.kr
                </div>
              </div>
            </div>

            {/* App Content */}
            <div className="flex min-h-[400px]">
              {/* Sidebar */}
              <div className="w-52 p-4" style={{ borderRight: `1px solid ${border}` }}>
                <div className="mb-5">
                  <div className="mb-2 text-xs font-medium tracking-wide uppercase" style={{ color: textFaint }}>
                    폴더
                  </div>
                  <div className="space-y-1">
                    {[
                      { name: '개발', count: 24, active: true },
                      { name: '디자인', count: 18, active: false },
                      { name: '마케팅', count: 12, active: false },
                    ].map((folder) => (
                      <div
                        key={folder.name}
                        className="flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors"
                        style={{
                          backgroundColor: folder.active ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)') : 'transparent',
                          color: folder.active ? text : textMuted,
                        }}
                      >
                        <span>{folder.name}</span>
                        <span style={{ color: textFaint, fontSize: '12px' }}>{folder.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-xs font-medium tracking-wide uppercase" style={{ color: textFaint }}>
                    태그
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {['React', 'Next.js', 'TypeScript'].map((tag) => (
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

              {/* Main */}
              <div className="flex-1 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold" style={{ color: text }}>
                    개발 <span style={{ color: textFaint, fontWeight: 'normal' }}>(24)</span>
                  </h3>
                  <div
                    className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm"
                    style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', color: textFaint }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
                    </svg>
                    검색...
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {[
                    { title: 'Next.js 15 공식 문서', domain: 'nextjs.org', tag: 'Next.js' },
                    { title: 'React Server Components', domain: 'react.dev', tag: 'React' },
                    { title: 'TypeScript 5.0 가이드', domain: 'typescriptlang.org', tag: 'TypeScript' },
                    { title: 'Tailwind CSS 팁', domain: 'tailwindcss.com', tag: 'CSS' },
                  ].map((link, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-xl p-3 transition-colors"
                      style={{ backgroundColor: bgCard, border: `1px solid ${border}` }}
                    >
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-medium"
                        style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', color: textFaint }}
                      >
                        {link.domain.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-0.5 truncate text-sm font-medium" style={{ color: text }}>
                          {link.title}
                        </div>
                        <div className="flex items-center gap-2 text-xs" style={{ color: textFaint }}>
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
        </div>
      </section>

      {/* ========================================
          SECTION 3: FEATURES (Cards Style)
          ======================================== */}
      <section className="px-6 py-24" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">
              왜 <span style={{ color: PRIMARY_LIGHT }}>Marked</span>인가요?
            </h2>
            <p style={{ color: textMuted }}>단순한 북마크가 아닌, 진짜 지식 관리 도구</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={PRIMARY_LIGHT} strokeWidth="2">
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                  </svg>
                ),
                title: '원클릭 저장',
                desc: '브라우저 익스텐션으로 보고 있는 페이지를 바로 저장하세요',
              },
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={PRIMARY_LIGHT} strokeWidth="2">
                    <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
                title: '스마트 분류',
                desc: '폴더와 태그로 체계적인 분류 시스템을 구축하세요',
              },
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={PRIMARY_LIGHT} strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
                  </svg>
                ),
                title: '즉시 검색',
                desc: '저장한 모든 콘텐츠를 키워드로 빠르게 찾아보세요',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="rounded-2xl p-6 transition-all hover:-translate-y-1"
                style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
                  border: `1px solid ${border}`,
                }}
              >
                <div
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${PRIMARY}15` }}
                >
                  {feature.icon}
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: textMuted }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================
          SECTION 4: HOW IT WORKS (Split Style)
          ======================================== */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            {/* Left: Steps */}
            <div>
              <h2 className="mb-8 text-3xl font-bold">
                <span style={{ color: PRIMARY_LIGHT }}>3단계</span>로 시작하세요
              </h2>

              <div className="space-y-6">
                {[
                  { step: '01', title: '회원가입', desc: 'Google 계정으로 10초 만에 가입하세요' },
                  { step: '02', title: '링크 저장', desc: '익스텐션 설치 후 원클릭으로 저장' },
                  { step: '03', title: '정리 & 검색', desc: '폴더와 태그로 정리하고 빠르게 검색' },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-mono text-sm font-bold"
                      style={{ backgroundColor: `${PRIMARY}15`, color: PRIMARY_LIGHT }}
                    >
                      {item.step}
                    </div>
                    <div>
                      <h3 className="mb-1 font-semibold">{item.title}</h3>
                      <p className="text-sm" style={{ color: textMuted }}>
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Visual */}
            <div
              className="rounded-2xl p-6"
              style={{
                backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                border: `1px solid ${border}`,
              }}
            >
              <div className="mb-4 flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: PRIMARY }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
                    <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold">Marked</div>
                  <div className="text-xs" style={{ color: textFaint }}>
                    지식 워크스페이스
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { label: '저장된 링크', value: '156개' },
                  { label: '폴더', value: '8개' },
                  { label: '태그', value: '24개' },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="flex items-center justify-between rounded-lg px-4 py-3"
                    style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}
                  >
                    <span style={{ color: textMuted }}>{stat.label}</span>
                    <span className="font-semibold">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          SECTION 5: CTA
          ======================================== */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <div
            className="rounded-2xl p-10 text-center"
            style={{ backgroundColor: PRIMARY }}
          >
            <h2 className="mb-4 text-3xl font-bold text-white">지금 바로 시작하세요</h2>
            <p className="mb-8 text-white/80">
              무료로 시작하고, 필요할 때 업그레이드하세요. 신용카드가 필요 없습니다.
            </p>
            <div className="flex justify-center gap-4">
              <button className="rounded-lg bg-white px-8 py-3.5 font-semibold text-gray-900 transition-opacity hover:opacity-90">
                무료로 시작하기
              </button>
              <button className="rounded-lg border border-white/30 px-8 py-3.5 font-medium text-white transition-colors hover:bg-white/10">
                자세히 알아보기
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          FOOTER
          ======================================== */}
      <footer className="px-6 py-12" style={{ borderTop: `1px solid ${border}` }}>
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ backgroundColor: PRIMARY }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white">
                  <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="font-semibold">Marked</span>
            </div>
            <div className="text-sm" style={{ color: textFaint }}>
              © 2024 Marked. 링크를 저장하는 게 아니라, 지식으로 정리합니다.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
