'use client';

import { useState } from 'react';

type Theme = 'dark' | 'light';

// Brand Colors
const BRAND = {
  primary: '#059669',
  primaryLight: '#10B981',
  primaryDark: '#047857',
  secondary: '#0D9488',
  accent: '#14B8A6',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
};

// Neutral Palette
const NEUTRAL = {
  50: '#F9FAFB',
  100: '#F3F4F6',
  200: '#E5E7EB',
  300: '#D1D5DB',
  400: '#9CA3AF',
  500: '#6B7280',
  600: '#4B5563',
  700: '#374151',
  800: '#1F2937',
  900: '#111827',
  950: '#030712',
};

export default function BrandingPage() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const isDark = theme === 'dark';

  const bg = isDark ? '#0a0f0d' : '#ffffff';
  const bgCard = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
  const text = isDark ? '#ffffff' : '#111827';
  const textMuted = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';
  const textFaint = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
  const border = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  const copyToClipboard = (color: string) => {
    navigator.clipboard.writeText(color);
    setCopiedColor(color);
    setTimeout(() => setCopiedColor(null), 1500);
  };

  const ColorSwatch = ({
    color,
    name,
    size = 'normal',
  }: {
    color: string;
    name: string;
    size?: 'normal' | 'large';
  }) => (
    <button
      onClick={() => copyToClipboard(color)}
      className={`group relative overflow-hidden rounded-xl transition-all hover:scale-105 ${
        size === 'large' ? 'h-32' : 'h-20'
      }`}
      style={{ backgroundColor: color }}
    >
      <div className="absolute inset-0 flex flex-col justify-end p-3">
        <div
          className="text-xs font-medium"
          style={{ color: isLightColor(color) ? '#111827' : '#ffffff' }}
        >
          {name}
        </div>
        <div
          className="font-mono text-xs opacity-70"
          style={{ color: isLightColor(color) ? '#111827' : '#ffffff' }}
        >
          {color}
        </div>
      </div>
      {copiedColor === color && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <span className="text-sm font-medium text-white">Copied!</span>
        </div>
      )}
    </button>
  );

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{
        backgroundColor: bg,
        color: text,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Theme Toggle */}
      <div className="fixed right-4 top-4 z-50">
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
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
              Light
            </>
          ) : (
            <>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
              Dark
            </>
          )}
        </button>
      </div>

      {/* Header */}
      <header className="border-b px-6 py-20" style={{ borderColor: border }}>
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 flex items-center gap-6">
            <div
              className="flex h-20 w-20 items-center justify-center rounded-2xl"
              style={{ backgroundColor: BRAND.primary }}
            >
              {/* Marked Logo - Stylized M lettermark */}
              <svg width="42" height="42" viewBox="0 0 48 48" fill="none">
                <path
                  d="M10 38V14L24 28L38 14V38"
                  stroke="white"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-5xl font-bold tracking-tight">Marked</h1>
              <p className="text-xl" style={{ color: textMuted }}>
                Brand Guidelines
              </p>
            </div>
          </div>
          <p className="max-w-2xl text-lg leading-relaxed" style={{ color: textMuted }}>
            브랜드 일관성을 위한 디자인 시스템입니다. 컬러, 타이포그래피, 로고 사용 가이드를
            확인하세요.
          </p>
        </div>
      </header>

      {/* Logo Section */}
      <section className="border-b px-6 py-16" style={{ borderColor: border }}>
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-2 text-sm font-medium uppercase tracking-widest" style={{ color: BRAND.primary }}>
            Logo
          </h2>
          <h3 className="mb-8 text-2xl font-bold">로고 시스템</h3>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Primary Logo - Dark */}
            <div
              className="flex h-56 flex-col items-center justify-center rounded-2xl"
              style={{ backgroundColor: NEUTRAL[900] }}
            >
              <div className="mb-6 flex items-center gap-4">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-xl"
                  style={{ backgroundColor: BRAND.primary }}
                >
                  <svg width="30" height="30" viewBox="0 0 40 40" fill="none">
                    <path fillRule="evenodd" clipRule="evenodd" d="M33.5 10.5C34.5 11.5 34.5 13.1 33.5 14.1L17.5 30.1C16.5 31.1 14.9 31.1 13.9 30.1L6.5 22.7C5.5 21.7 5.5 20.1 6.5 19.1C7.5 18.1 9.1 18.1 10.1 19.1L15.7 24.7L29.9 10.5C30.9 9.5 32.5 9.5 33.5 10.5Z" fill="white" />
                  </svg>
                </div>
                <span className="text-3xl font-bold text-white">Marked</span>
              </div>
              <span className="text-xs text-white/50">어두운 배경</span>
            </div>

            {/* Primary Logo - Light */}
            <div
              className="flex h-56 flex-col items-center justify-center rounded-2xl border"
              style={{ backgroundColor: '#ffffff', borderColor: NEUTRAL[200] }}
            >
              <div className="mb-6 flex items-center gap-4">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-xl"
                  style={{ backgroundColor: BRAND.primary }}
                >
                  <svg width="30" height="30" viewBox="0 0 40 40" fill="none">
                    <path fillRule="evenodd" clipRule="evenodd" d="M33.5 10.5C34.5 11.5 34.5 13.1 33.5 14.1L17.5 30.1C16.5 31.1 14.9 31.1 13.9 30.1L6.5 22.7C5.5 21.7 5.5 20.1 6.5 19.1C7.5 18.1 9.1 18.1 10.1 19.1L15.7 24.7L29.9 10.5C30.9 9.5 32.5 9.5 33.5 10.5Z" fill="white" />
                  </svg>
                </div>
                <span className="text-3xl font-bold" style={{ color: NEUTRAL[900] }}>
                  Marked
                </span>
              </div>
              <span className="text-xs" style={{ color: NEUTRAL[400] }}>
                밝은 배경
              </span>
            </div>

            {/* Icon Only */}
            <div
              className="flex h-56 flex-col items-center justify-center rounded-2xl"
              style={{ backgroundColor: bgCard, border: `1px solid ${border}` }}
            >
              <div
                className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{ backgroundColor: BRAND.primary }}
              >
                <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
                  <path fillRule="evenodd" clipRule="evenodd" d="M33.5 10.5C34.5 11.5 34.5 13.1 33.5 14.1L17.5 30.1C16.5 31.1 14.9 31.1 13.9 30.1L6.5 22.7C5.5 21.7 5.5 20.1 6.5 19.1C7.5 18.1 9.1 18.1 10.1 19.1L15.7 24.7L29.9 10.5C30.9 9.5 32.5 9.5 33.5 10.5Z" fill="white" />
                </svg>
              </div>
              <span className="text-xs" style={{ color: textFaint }}>
                아이콘 단독
              </span>
            </div>
          </div>

          {/* Logo Variations */}
          <div className="mt-8">
            <h4 className="mb-4 font-semibold">로고 사이즈</h4>
            <div
              className="flex items-end gap-8 rounded-2xl p-8"
              style={{ backgroundColor: bgCard, border: `1px solid ${border}` }}
            >
              {/* XL */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: BRAND.primary }}
                >
                  <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
                    <path fillRule="evenodd" clipRule="evenodd" d="M33.5 10.5C34.5 11.5 34.5 13.1 33.5 14.1L17.5 30.1C16.5 31.1 14.9 31.1 13.9 30.1L6.5 22.7C5.5 21.7 5.5 20.1 6.5 19.1C7.5 18.1 9.1 18.1 10.1 19.1L15.7 24.7L29.9 10.5C30.9 9.5 32.5 9.5 33.5 10.5Z" fill="white" />
                  </svg>
                </div>
                <span className="font-mono text-xs" style={{ color: textFaint }}>64px</span>
              </div>
              {/* Large */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ backgroundColor: BRAND.primary }}
                >
                  <svg width="26" height="26" viewBox="0 0 40 40" fill="none">
                    <path fillRule="evenodd" clipRule="evenodd" d="M33.5 10.5C34.5 11.5 34.5 13.1 33.5 14.1L17.5 30.1C16.5 31.1 14.9 31.1 13.9 30.1L6.5 22.7C5.5 21.7 5.5 20.1 6.5 19.1C7.5 18.1 9.1 18.1 10.1 19.1L15.7 24.7L29.9 10.5C30.9 9.5 32.5 9.5 33.5 10.5Z" fill="white" />
                  </svg>
                </div>
                <span className="font-mono text-xs" style={{ color: textFaint }}>48px</span>
              </div>
              {/* Medium */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: BRAND.primary }}
                >
                  <svg width="22" height="22" viewBox="0 0 40 40" fill="none">
                    <path fillRule="evenodd" clipRule="evenodd" d="M33.5 10.5C34.5 11.5 34.5 13.1 33.5 14.1L17.5 30.1C16.5 31.1 14.9 31.1 13.9 30.1L6.5 22.7C5.5 21.7 5.5 20.1 6.5 19.1C7.5 18.1 9.1 18.1 10.1 19.1L15.7 24.7L29.9 10.5C30.9 9.5 32.5 9.5 33.5 10.5Z" fill="white" />
                  </svg>
                </div>
                <span className="font-mono text-xs" style={{ color: textFaint }}>40px</span>
              </div>
              {/* Small */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-md"
                  style={{ backgroundColor: BRAND.primary }}
                >
                  <svg width="18" height="18" viewBox="0 0 40 40" fill="none">
                    <path fillRule="evenodd" clipRule="evenodd" d="M33.5 10.5C34.5 11.5 34.5 13.1 33.5 14.1L17.5 30.1C16.5 31.1 14.9 31.1 13.9 30.1L6.5 22.7C5.5 21.7 5.5 20.1 6.5 19.1C7.5 18.1 9.1 18.1 10.1 19.1L15.7 24.7L29.9 10.5C30.9 9.5 32.5 9.5 33.5 10.5Z" fill="white" />
                  </svg>
                </div>
                <span className="font-mono text-xs" style={{ color: textFaint }}>32px</span>
              </div>
              {/* XS */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className="flex h-6 w-6 items-center justify-center rounded"
                  style={{ backgroundColor: BRAND.primary }}
                >
                  <svg width="14" height="14" viewBox="0 0 40 40" fill="none">
                    <path fillRule="evenodd" clipRule="evenodd" d="M33.5 10.5C34.5 11.5 34.5 13.1 33.5 14.1L17.5 30.1C16.5 31.1 14.9 31.1 13.9 30.1L6.5 22.7C5.5 21.7 5.5 20.1 6.5 19.1C7.5 18.1 9.1 18.1 10.1 19.1L15.7 24.7L29.9 10.5C30.9 9.5 32.5 9.5 33.5 10.5Z" fill="white" />
                  </svg>
                </div>
                <span className="font-mono text-xs" style={{ color: textFaint }}>24px</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Color Palette Section */}
      <section className="border-b px-6 py-16" style={{ borderColor: border }}>
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-2 text-sm font-medium uppercase tracking-widest" style={{ color: BRAND.primary }}>
            Colors
          </h2>
          <h3 className="mb-8 text-2xl font-bold">컬러 팔레트</h3>

          {/* Primary Colors */}
          <div className="mb-10">
            <h4 className="mb-4 font-semibold">Primary</h4>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
              <ColorSwatch color={BRAND.primaryDark} name="Primary Dark" size="large" />
              <ColorSwatch color={BRAND.primary} name="Primary" size="large" />
              <ColorSwatch color={BRAND.primaryLight} name="Primary Light" size="large" />
              <ColorSwatch color={BRAND.secondary} name="Secondary" size="large" />
              <ColorSwatch color={BRAND.accent} name="Accent" size="large" />
            </div>
          </div>

          {/* Semantic Colors */}
          <div className="mb-10">
            <h4 className="mb-4 font-semibold">Semantic</h4>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <ColorSwatch color={BRAND.success} name="Success" />
              <ColorSwatch color={BRAND.warning} name="Warning" />
              <ColorSwatch color={BRAND.error} name="Error" />
              <ColorSwatch color={BRAND.info} name="Info" />
            </div>
          </div>

          {/* Neutral Palette */}
          <div>
            <h4 className="mb-4 font-semibold">Neutral</h4>
            <div className="grid grid-cols-3 gap-3 md:grid-cols-6 lg:grid-cols-11">
              {Object.entries(NEUTRAL).map(([key, value]) => (
                <ColorSwatch key={key} color={value} name={key} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Typography Section */}
      <section className="border-b px-6 py-16" style={{ borderColor: border }}>
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-2 text-sm font-medium uppercase tracking-widest" style={{ color: BRAND.primary }}>
            Typography
          </h2>
          <h3 className="mb-8 text-2xl font-bold">타이포그래피</h3>

          <div className="space-y-8">
            {/* Font Family */}
            <div
              className="rounded-2xl p-6"
              style={{ backgroundColor: bgCard, border: `1px solid ${border}` }}
            >
              <h4 className="mb-4 font-semibold">Font Family</h4>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <p className="mb-2 text-sm" style={{ color: textMuted }}>
                    Primary (System)
                  </p>
                  <p className="text-2xl" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                    system-ui, -apple-system
                  </p>
                </div>
                <div>
                  <p className="mb-2 text-sm" style={{ color: textMuted }}>
                    Monospace
                  </p>
                  <p className="font-mono text-2xl">ui-monospace, monospace</p>
                </div>
              </div>
            </div>

            {/* Type Scale */}
            <div
              className="rounded-2xl p-6"
              style={{ backgroundColor: bgCard, border: `1px solid ${border}` }}
            >
              <h4 className="mb-6 font-semibold">Type Scale</h4>
              <div className="space-y-4">
                {[
                  { size: '4xl', px: '36px', sample: 'Display Large' },
                  { size: '3xl', px: '30px', sample: 'Display Medium' },
                  { size: '2xl', px: '24px', sample: 'Heading Large' },
                  { size: 'xl', px: '20px', sample: 'Heading Medium' },
                  { size: 'lg', px: '18px', sample: 'Heading Small' },
                  { size: 'base', px: '16px', sample: 'Body Large' },
                  { size: 'sm', px: '14px', sample: 'Body Small' },
                  { size: 'xs', px: '12px', sample: 'Caption' },
                ].map((item) => (
                  <div key={item.size} className="flex items-baseline gap-4 border-b pb-4" style={{ borderColor: border }}>
                    <span
                      className="w-16 shrink-0 font-mono text-xs"
                      style={{ color: textFaint }}
                    >
                      {item.px}
                    </span>
                    <span className={`text-${item.size} font-semibold`}>{item.sample}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Font Weight */}
            <div
              className="rounded-2xl p-6"
              style={{ backgroundColor: bgCard, border: `1px solid ${border}` }}
            >
              <h4 className="mb-6 font-semibold">Font Weight</h4>
              <div className="space-y-4">
                {[
                  { weight: 400, name: 'Regular' },
                  { weight: 500, name: 'Medium' },
                  { weight: 600, name: 'Semibold' },
                  { weight: 700, name: 'Bold' },
                ].map((item) => (
                  <div key={item.weight} className="flex items-center gap-4">
                    <span
                      className="w-12 shrink-0 font-mono text-xs"
                      style={{ color: textFaint }}
                    >
                      {item.weight}
                    </span>
                    <span className="text-xl" style={{ fontWeight: item.weight }}>
                      {item.name} - 지식을 정리합니다
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Spacing & Grid Section */}
      <section className="border-b px-6 py-16" style={{ borderColor: border }}>
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-2 text-sm font-medium uppercase tracking-widest" style={{ color: BRAND.primary }}>
            Spacing
          </h2>
          <h3 className="mb-8 text-2xl font-bold">간격 시스템</h3>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Spacing Scale */}
            <div
              className="rounded-2xl p-6"
              style={{ backgroundColor: bgCard, border: `1px solid ${border}` }}
            >
              <h4 className="mb-4 font-semibold">Spacing Scale</h4>
              <div className="space-y-3">
                {[
                  { name: '4px', key: '1' },
                  { name: '8px', key: '2' },
                  { name: '12px', key: '3' },
                  { name: '16px', key: '4' },
                  { name: '24px', key: '6' },
                  { name: '32px', key: '8' },
                  { name: '48px', key: '12' },
                  { name: '64px', key: '16' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center gap-4">
                    <span className="w-12 font-mono text-xs" style={{ color: textFaint }}>
                      {item.name}
                    </span>
                    <div
                      className="h-4 rounded"
                      style={{
                        width: item.name,
                        backgroundColor: BRAND.primary,
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Border Radius */}
            <div
              className="rounded-2xl p-6"
              style={{ backgroundColor: bgCard, border: `1px solid ${border}` }}
            >
              <h4 className="mb-4 font-semibold">Border Radius</h4>
              <div className="space-y-4">
                {[
                  { name: 'sm', value: '4px' },
                  { name: 'md', value: '6px' },
                  { name: 'lg', value: '8px' },
                  { name: 'xl', value: '12px' },
                  { name: '2xl', value: '16px' },
                  { name: 'full', value: '9999px' },
                ].map((item) => (
                  <div key={item.name} className="flex items-center gap-4">
                    <span className="w-16 font-mono text-xs" style={{ color: textFaint }}>
                      {item.value}
                    </span>
                    <div
                      className="h-12 w-24"
                      style={{
                        backgroundColor: BRAND.primary,
                        borderRadius: item.value,
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Components Preview */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-2 text-sm font-medium uppercase tracking-widest" style={{ color: BRAND.primary }}>
            Components
          </h2>
          <h3 className="mb-8 text-2xl font-bold">컴포넌트 미리보기</h3>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Buttons */}
            <div
              className="rounded-2xl p-6"
              style={{ backgroundColor: bgCard, border: `1px solid ${border}` }}
            >
              <h4 className="mb-4 font-semibold">Buttons</h4>
              <div className="flex flex-wrap gap-3">
                <button
                  className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: BRAND.primary }}
                >
                  Primary
                </button>
                <button
                  className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                  style={{ border: `1px solid ${border}`, color: text }}
                >
                  Secondary
                </button>
                <button
                  className="rounded-lg px-4 py-2 text-sm font-medium"
                  style={{ backgroundColor: `${BRAND.primary}15`, color: BRAND.primaryLight }}
                >
                  Ghost
                </button>
              </div>
            </div>

            {/* Badges */}
            <div
              className="rounded-2xl p-6"
              style={{ backgroundColor: bgCard, border: `1px solid ${border}` }}
            >
              <h4 className="mb-4 font-semibold">Badges</h4>
              <div className="flex flex-wrap gap-2">
                <span
                  className="rounded-full px-3 py-1 text-xs font-medium"
                  style={{ backgroundColor: `${BRAND.primary}20`, color: BRAND.primaryLight }}
                >
                  Default
                </span>
                <span
                  className="rounded-full px-3 py-1 text-xs font-medium"
                  style={{ backgroundColor: `${BRAND.success}20`, color: BRAND.success }}
                >
                  Success
                </span>
                <span
                  className="rounded-full px-3 py-1 text-xs font-medium"
                  style={{ backgroundColor: `${BRAND.warning}20`, color: BRAND.warning }}
                >
                  Warning
                </span>
                <span
                  className="rounded-full px-3 py-1 text-xs font-medium"
                  style={{ backgroundColor: `${BRAND.error}20`, color: BRAND.error }}
                >
                  Error
                </span>
              </div>
            </div>

            {/* Input */}
            <div
              className="rounded-2xl p-6"
              style={{ backgroundColor: bgCard, border: `1px solid ${border}` }}
            >
              <h4 className="mb-4 font-semibold">Input</h4>
              <input
                type="text"
                placeholder="placeholder text..."
                className="w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all focus:ring-2"
                style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  border: `1px solid ${border}`,
                  color: text,
                }}
              />
            </div>

            {/* Cards */}
            <div
              className="rounded-2xl p-6"
              style={{ backgroundColor: bgCard, border: `1px solid ${border}` }}
            >
              <h4 className="mb-4 font-semibold">Card</h4>
              <div
                className="rounded-xl p-4 transition-all hover:-translate-y-0.5"
                style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
                  border: `1px solid ${border}`,
                }}
              >
                <div className="mb-2 font-medium">Card Title</div>
                <p className="text-sm" style={{ color: textMuted }}>
                  Card content goes here with description text.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-6 py-8" style={{ borderColor: border }}>
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-sm" style={{ color: textFaint }}>
            Marked Brand Guidelines v1.0 — Design System
          </p>
        </div>
      </footer>
    </div>
  );
}

// Helper function to determine if a color is light or dark
function isLightColor(color: string): boolean {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128;
}
