'use client';

import { useState } from 'react';

type BrandingOption = 'noir' | 'aurora' | 'brutalist' | 'organic';

export default function BrandingShowcase() {
  const [activeTab, setActiveTab] = useState<BrandingOption>('noir');

  const tabs: { id: BrandingOption; label: string; subtitle: string }[] = [
    { id: 'noir', label: 'Noir Minimal', subtitle: 'Luxury & Refined' },
    { id: 'aurora', label: 'Aurora', subtitle: 'Vibrant & Dynamic' },
    { id: 'brutalist', label: 'Brutalist', subtitle: 'Raw & Bold' },
    { id: 'organic', label: 'Organic', subtitle: 'Warm & Natural' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Tab Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center justify-between py-4">
            <span className="text-sm font-medium tracking-widest text-white/60 uppercase">
              Branding Showcase
            </span>
            <div className="flex gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group relative px-5 py-2.5 text-sm font-medium transition-all duration-300 ${
                    activeTab === tab.id ? 'text-white' : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  <span className="relative z-10">{tab.label}</span>
                  <span
                    className={`absolute inset-x-0 -bottom-[17px] h-[2px] transition-all duration-300 ${
                      activeTab === tab.id ? 'bg-white' : 'bg-transparent group-hover:bg-white/20'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Content Area */}
      <main className="pt-[73px]">
        {activeTab === 'noir' && <NoirMinimal />}
        {activeTab === 'aurora' && <AuroraBranding />}
        {activeTab === 'brutalist' && <BrutalistBranding />}
        {activeTab === 'organic' && <OrganicBranding />}
      </main>
    </div>
  );
}

/* ============================================
   BRANDING 1: NOIR MINIMAL
   Luxury, refined, editorial elegance
   ============================================ */
function NoirMinimal() {
  return (
    <div
      className="relative min-h-screen overflow-hidden font-[family-name:var(--font-cormorant)]"
      style={{
        background: 'linear-gradient(180deg, #0a0a0a 0%, #111111 50%, #0a0a0a 100%)',
      }}
    >
      {/* Subtle grain overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Elegant line accents */}
      <div className="absolute top-0 left-1/4 h-full w-px bg-gradient-to-b from-transparent via-white/5 to-transparent" />
      <div className="absolute top-0 right-1/4 h-full w-px bg-gradient-to-b from-transparent via-white/5 to-transparent" />

      <div className="relative flex min-h-screen flex-col items-center justify-center px-6">
        {/* Floating label */}
        <div className="absolute top-32 left-1/2 -translate-x-1/2">
          <span
            className="text-[10px] tracking-[0.4em] text-white/30 uppercase"
            style={{ fontFamily: 'system-ui, sans-serif' }}
          >
            Knowledge Management Reimagined
          </span>
        </div>

        {/* Main content */}
        <div className="max-w-4xl text-center">
          {/* Logo mark */}
          <div className="mb-16 flex justify-center">
            <div className="relative">
              <div className="h-px w-24 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
              <div className="my-6 flex items-center justify-center gap-4">
                <div className="h-2 w-2 rotate-45 border border-white/30" />
                <span
                  className="text-lg tracking-[0.3em] text-white/60 uppercase"
                  style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 300 }}
                >
                  Marked
                </span>
                <div className="h-2 w-2 rotate-45 border border-white/30" />
              </div>
              <div className="h-px w-24 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            </div>
          </div>

          {/* Hero text */}
          <h1 className="mb-8 text-6xl leading-[1.1] font-light tracking-tight text-white md:text-8xl font-[family-name:var(--font-cormorant)]">
            Links become
            <br />
            <span className="italic text-white/70">knowledge</span>
          </h1>

          <p className="mx-auto mb-4 max-w-xl text-xl leading-relaxed font-light text-white/40 font-[family-name:var(--font-cormorant)]">
            링크를 저장하는 게 아니라,
            <br />
            지식으로 정리합니다.
          </p>

          <p
            className="mx-auto mb-16 max-w-md text-sm leading-relaxed text-white/25"
            style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 300 }}
          >
            Transform scattered bookmarks into your personal knowledge workspace. Every link becomes
            an asset.
          </p>

          {/* CTA */}
          <div className="flex flex-col items-center gap-6">
            <button
              className="group relative overflow-hidden border border-white/20 bg-transparent px-12 py-4 text-sm tracking-[0.2em] text-white uppercase transition-all duration-500 hover:border-white/40"
              style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 400 }}
            >
              <span className="relative z-10 transition-colors duration-500 group-hover:text-black">
                Begin Your Collection
              </span>
              <div className="absolute inset-0 -translate-x-full bg-white transition-transform duration-500 group-hover:translate-x-0" />
            </button>

            <span
              className="text-[11px] tracking-widest text-white/20"
              style={{ fontFamily: 'system-ui, sans-serif' }}
            >
              Free forever • No credit card
            </span>
          </div>
        </div>

        {/* Bottom accent */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-8 text-white/15">
            <div className="h-px w-16 bg-white/15" />
            <span
              className="text-[10px] tracking-[0.3em] uppercase"
              style={{ fontFamily: 'system-ui, sans-serif' }}
            >
              Est. 2024
            </span>
            <div className="h-px w-16 bg-white/15" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================
   BRANDING 2: AURORA
   Vibrant gradients, dynamic, energetic
   ============================================ */
function AuroraBranding() {
  return (
    <div
      className="relative min-h-screen overflow-hidden font-[family-name:var(--font-dm-sans)]"
      style={{
        background: '#050510',
      }}
    >
      {/* Aurora gradient background */}
      <div className="absolute inset-0">
        <div
          className="absolute -top-1/2 -left-1/4 h-[800px] w-[800px] animate-pulse rounded-full opacity-30 blur-[120px]"
          style={{
            background: 'radial-gradient(circle, #7c3aed 0%, #2563eb 50%, transparent 70%)',
            animationDuration: '8s',
          }}
        />
        <div
          className="absolute -right-1/4 -bottom-1/4 h-[600px] w-[600px] animate-pulse rounded-full opacity-25 blur-[100px]"
          style={{
            background: 'radial-gradient(circle, #06b6d4 0%, #8b5cf6 50%, transparent 70%)',
            animationDuration: '10s',
            animationDelay: '2s',
          }}
        />
        <div
          className="absolute top-1/3 left-1/2 h-[400px] w-[400px] -translate-x-1/2 animate-pulse rounded-full opacity-20 blur-[80px]"
          style={{
            background: 'radial-gradient(circle, #ec4899 0%, #f97316 50%, transparent 70%)',
            animationDuration: '6s',
            animationDelay: '4s',
          }}
        />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative flex min-h-screen flex-col items-center justify-center px-6">
        {/* Floating badges */}
        <div className="absolute top-28 left-1/2 flex -translate-x-1/2 items-center gap-3">
          <span
            className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/60 backdrop-blur-sm"
            style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}
          >
            ✨ Introducing Marked 2.0
          </span>
        </div>

        <div className="max-w-5xl text-center">
          {/* Glowing logo */}
          <div className="mb-12 flex justify-center">
            <div className="relative">
              <div
                className="absolute inset-0 animate-pulse rounded-2xl blur-2xl"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                  animationDuration: '3s',
                }}
              />
              <div
                className="relative rounded-2xl p-4"
                style={{
                  background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(6,182,212,0.3))',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="text-white">
                  <path
                    d="M8 12C8 9.79086 9.79086 8 12 8H36C38.2091 8 40 9.79086 40 12V36C40 38.2091 38.2091 40 36 40H12C9.79086 40 8 38.2091 8 36V12Z"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M16 20L22 26L32 16"
                    stroke="url(#aurora-check)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <defs>
                    <linearGradient id="aurora-check" x1="16" y1="20" x2="32" y2="20">
                      <stop stopColor="#7c3aed" />
                      <stop offset="1" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          </div>

          {/* Hero text with gradient */}
          <h1
            className="mb-6 text-5xl font-bold leading-[1.15] tracking-tight md:text-7xl"
            style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}
          >
            <span className="text-white">Your links,</span>
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: 'linear-gradient(135deg, #7c3aed 0%, #06b6d4 50%, #ec4899 100%)',
              }}
            >
              supercharged
            </span>
          </h1>

          <p
            className="mx-auto mb-3 max-w-2xl text-xl leading-relaxed font-medium text-white/70"
            style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}
          >
            링크를 저장하는 게 아니라, 지식으로 정리합니다.
          </p>

          <p
            className="mx-auto mb-12 max-w-lg text-base text-white/40"
            style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}
          >
            Stop losing valuable links in browser chaos. Transform every bookmark into a searchable,
            organized knowledge asset.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              className="group relative overflow-hidden rounded-xl px-8 py-4 text-base font-semibold text-white shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-purple-500/25"
              style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
                fontFamily: '"DM Sans", system-ui, sans-serif',
              }}
            >
              <span className="relative z-10 flex items-center gap-2">
                Start for free
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M4 10H16M16 10L11 5M16 10L11 15"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>

            <button
              className="rounded-xl border border-white/20 bg-white/5 px-8 py-4 text-base font-medium text-white backdrop-blur-sm transition-all duration-300 hover:border-white/30 hover:bg-white/10"
              style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}
            >
              Watch demo
            </button>
          </div>

          {/* Social proof */}
          <div className="mt-16 flex items-center justify-center gap-8">
            <div className="flex -space-x-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-10 w-10 rounded-full border-2 border-[#050510]"
                  style={{
                    background: `linear-gradient(135deg, hsl(${260 + i * 30}, 70%, 60%), hsl(${280 + i * 30}, 70%, 50%))`,
                  }}
                />
              ))}
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 0L10.2 5.3L16 6.1L11.8 10.1L12.9 16L8 13.3L3.1 16L4.2 10.1L0 6.1L5.8 5.3L8 0Z" />
                  </svg>
                ))}
              </div>
              <p
                className="text-sm text-white/50"
                style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}
              >
                Loved by 2,000+ knowledge workers
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================
   BRANDING 3: BRUTALIST
   Raw, bold, unapologetic, Swiss-inspired
   ============================================ */
function BrutalistBranding() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f5f5f0] font-[family-name:var(--font-space-mono)]">
      {/* Harsh grid lines */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-[10%] h-full w-[2px] bg-black" />
        <div className="absolute top-0 left-[90%] h-full w-[2px] bg-black" />
        <div className="absolute top-[15%] left-0 h-[2px] w-full bg-black" />
        <div className="absolute bottom-[15%] left-0 h-[2px] w-full bg-black" />
      </div>

      {/* Offset accent blocks */}
      <div className="absolute top-[15%] right-[10%] h-32 w-32 bg-[#ff3d00]" />
      <div className="absolute bottom-[15%] left-[10%] h-24 w-24 bg-black" />

      <div className="relative flex min-h-screen items-center px-6 py-32">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-16 lg:grid-cols-2">
          {/* Left column - Typography heavy */}
          <div className="flex flex-col justify-center">
            <div className="mb-8">
              <span className="inline-block border-2 border-black bg-black px-3 py-1 text-xs font-bold tracking-widest text-[#f5f5f0] uppercase">
                Marked®
              </span>
            </div>

            <h1 className="mb-8 text-6xl font-bold leading-[0.9] tracking-tighter text-black uppercase md:text-8xl">
              SAVE
              <br />
              <span className="text-[#ff3d00]">LINKS.</span>
              <br />
              BUILD
              <br />
              KNOW
              <br />
              LEDGE.
            </h1>

            <div className="mb-8 h-1 w-24 bg-black" />

            <p className="mb-4 max-w-sm text-lg font-bold leading-tight text-black">
              링크를 저장하는 게 아니라, 지식으로 정리합니다.
            </p>

            <p className="max-w-sm text-sm leading-relaxed text-black/60">
              WE DON&apos;T SAVE LINKS. WE TRANSFORM THEM INTO STRUCTURED KNOWLEDGE ASSETS. EVERY.
              SINGLE. ONE.
            </p>
          </div>

          {/* Right column - Functional brutalism */}
          <div className="flex flex-col justify-center">
            <div className="border-4 border-black bg-white p-8">
              <div className="mb-6 text-xs font-bold tracking-widest text-black/40 uppercase">
                {'// Start now'}
              </div>

              <div className="mb-6 space-y-4">
                <div className="border-2 border-black p-4 transition-colors hover:bg-[#ff3d00] hover:text-white">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold uppercase">01. Sign up</span>
                    <span className="text-2xl">→</span>
                  </div>
                </div>

                <div className="border-2 border-black p-4 transition-colors hover:bg-[#ff3d00] hover:text-white">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold uppercase">02. Import links</span>
                    <span className="text-2xl">→</span>
                  </div>
                </div>

                <div className="border-2 border-black p-4 transition-colors hover:bg-[#ff3d00] hover:text-white">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold uppercase">03. Organize</span>
                    <span className="text-2xl">→</span>
                  </div>
                </div>
              </div>

              <button className="w-full bg-black py-5 text-lg font-bold tracking-wider text-[#f5f5f0] uppercase transition-all hover:bg-[#ff3d00]">
                Get started — Free
              </button>

              <div className="mt-4 text-center text-xs text-black/40">
                NO CREDIT CARD • NO BS • JUST KNOWLEDGE
              </div>
            </div>

            {/* Stats block */}
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="border-2 border-black bg-black p-4 text-center text-[#f5f5f0]">
                <div className="text-3xl font-bold">2K+</div>
                <div className="text-[10px] tracking-widest uppercase">Users</div>
              </div>
              <div className="border-2 border-black p-4 text-center">
                <div className="text-3xl font-bold">50K</div>
                <div className="text-[10px] tracking-widest uppercase">Links</div>
              </div>
              <div className="border-2 border-black bg-[#ff3d00] p-4 text-center text-white">
                <div className="text-3xl font-bold">∞</div>
                <div className="text-[10px] tracking-widest uppercase">Ideas</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer strip */}
      <div className="absolute right-0 bottom-0 left-0 border-t-2 border-black bg-black py-4">
        <div className="flex items-center justify-center gap-8 text-xs tracking-widest text-[#f5f5f0]/60 uppercase">
          <span>© 2024</span>
          <span>•</span>
          <span>Seoul, Korea</span>
          <span>•</span>
          <span>Built different.</span>
        </div>
      </div>
    </div>
  );
}

/* ============================================
   BRANDING 4: ORGANIC
   Warm, natural, calm, paper-like textures
   ============================================ */
function OrganicBranding() {
  return (
    <div
      className="relative min-h-screen overflow-hidden font-[family-name:var(--font-libre-baskerville)]"
      style={{
        background: 'linear-gradient(180deg, #faf8f5 0%, #f5f0e8 100%)',
      }}
    >
      {/* Paper texture overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Organic shapes */}
      <div className="absolute -top-20 -right-20 h-96 w-96 rounded-full bg-[#e8dfd3] opacity-60 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 h-[500px] w-[500px] rounded-full bg-[#d4c4a8] opacity-40 blur-3xl" />

      {/* Decorative botanical element */}
      <svg
        className="absolute top-20 right-20 h-64 w-64 text-[#c9b896] opacity-20"
        viewBox="0 0 200 200"
        fill="none"
      >
        <path d="M100 10 Q120 50 100 100 Q80 150 100 190" stroke="currentColor" strokeWidth="1" />
        <path d="M100 50 Q140 60 160 40" stroke="currentColor" strokeWidth="1" />
        <path d="M100 80 Q60 90 40 70" stroke="currentColor" strokeWidth="1" />
        <path d="M100 120 Q150 130 170 110" stroke="currentColor" strokeWidth="1" />
        <ellipse cx="160" cy="40" rx="15" ry="10" stroke="currentColor" strokeWidth="1" />
        <ellipse cx="40" cy="70" rx="15" ry="10" stroke="currentColor" strokeWidth="1" />
        <ellipse cx="170" cy="110" rx="15" ry="10" stroke="currentColor" strokeWidth="1" />
      </svg>

      <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-20">
        <div className="max-w-3xl text-center">
          {/* Handwritten-style logo */}
          <div className="mb-16">
            <div className="mb-4 inline-flex items-center gap-3">
              <div className="h-px w-12 bg-[#8b7355]" />
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                className="text-[#8b7355]"
              >
                <rect
                  x="4"
                  y="4"
                  width="24"
                  height="24"
                  rx="4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M10 16L14 20L22 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="h-px w-12 bg-[#8b7355]" />
            </div>
            <h2
              className="text-2xl tracking-wide text-[#5a4a3a]"
              style={{ fontFamily: '"Libre Baskerville", Georgia, serif', fontStyle: 'italic' }}
            >
              Marked
            </h2>
          </div>

          {/* Hero text */}
          <h1
            className="mb-8 text-4xl leading-[1.3] font-normal tracking-tight text-[#3d3428] md:text-6xl"
            style={{ fontFamily: '"Libre Baskerville", Georgia, serif' }}
          >
            Cultivate your
            <br />
            <span className="italic text-[#8b7355]">digital garden</span>
            <br />
            of knowledge
          </h1>

          <p
            className="mx-auto mb-4 max-w-lg text-xl leading-relaxed text-[#6b5c4c]"
            style={{ fontFamily: '"Libre Baskerville", Georgia, serif', fontStyle: 'italic' }}
          >
            링크를 저장하는 게 아니라, 지식으로 정리합니다.
          </p>

          <p
            className="mx-auto mb-12 max-w-md text-base leading-relaxed text-[#8b7a68]"
            style={{ fontFamily: '"Source Sans 3", system-ui, sans-serif', fontWeight: 400 }}
          >
            Like a well-tended garden, your saved links flourish into a beautiful collection of
            interconnected ideas and insights.
          </p>

          {/* CTA */}
          <div className="flex flex-col items-center gap-6">
            <button
              className="group relative overflow-hidden rounded-full border border-[#8b7355] bg-[#8b7355] px-10 py-4 text-base tracking-wide text-[#faf8f5] transition-all duration-500 hover:bg-[#6b5c4c]"
              style={{ fontFamily: '"Source Sans 3", system-ui, sans-serif', fontWeight: 500 }}
            >
              <span className="relative z-10 flex items-center gap-3">
                Begin your collection
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  className="transition-transform duration-300 group-hover:translate-x-1"
                >
                  <path
                    d="M4 10H16M16 10L11 5M16 10L11 15"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>

            <span
              className="text-sm text-[#a89880]"
              style={{ fontFamily: '"Source Sans 3", system-ui, sans-serif' }}
            >
              Free to start • No credit card needed
            </span>
          </div>

          {/* Feature cards */}
          <div className="mt-20 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { icon: '🌱', title: 'Plant', desc: 'Save links effortlessly' },
              { icon: '🌿', title: 'Nurture', desc: 'Organize & annotate' },
              { icon: '🌳', title: 'Grow', desc: 'Build your knowledge' },
            ].map((item, i) => (
              <div
                key={i}
                className="rounded-2xl border border-[#d4c4a8]/50 bg-white/60 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#d4c4a8]/20"
              >
                <div className="mb-3 text-3xl">{item.icon}</div>
                <h3
                  className="mb-2 text-lg text-[#5a4a3a]"
                  style={{ fontFamily: '"Libre Baskerville", Georgia, serif' }}
                >
                  {item.title}
                </h3>
                <p
                  className="text-sm text-[#8b7a68]"
                  style={{ fontFamily: '"Source Sans 3", system-ui, sans-serif' }}
                >
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom quote */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
          <p
            className="text-center text-sm text-[#a89880]"
            style={{ fontFamily: '"Libre Baskerville", Georgia, serif', fontStyle: 'italic' }}
          >
            &ldquo;The mind is a garden, thoughts are the seeds.&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}
