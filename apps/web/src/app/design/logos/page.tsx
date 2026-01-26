'use client';

import { useState } from 'react';

// Brand Colors
const BRAND = {
  primary: '#059669',
  primaryLight: '#10B981',
  primaryDark: '#047857',
};

type Theme = 'dark' | 'light';
type LogoVariant = 'icon' | 'wordmark';

interface LogoConcept {
  id: string;
  name: string;
  nameKr: string;
  description: string;
  Icon: React.FC<{ size?: number; color?: string }>;
  Wordmark: React.FC<{ size?: number; color?: string; textColor?: string }>;
}

// ============================================
// LOGO 1: Checkmark Bookmark (현재 테마)
// ============================================
const CheckmarkBookmarkIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 40,
  color = BRAND.primary,
}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="12" fill={color} />
    <path
      d="M14 24L21 31L34 18"
      stroke="white"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CheckmarkBookmarkWordmark: React.FC<{
  size?: number;
  color?: string;
  textColor?: string;
}> = ({ size = 40, color = BRAND.primary, textColor = 'currentColor' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.3 }}>
    <CheckmarkBookmarkIcon size={size} color={color} />
    <span
      style={{
        fontSize: size * 0.6,
        fontWeight: 700,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: textColor,
        letterSpacing: '-0.02em',
      }}
    >
      Marked
    </span>
  </div>
);

// ============================================
// LOGO 2: Open Book / Knowledge
// ============================================
const KnowledgeBookIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 40,
  color = BRAND.primary,
}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="12" fill={color} />
    {/* Open book with pages */}
    <path
      d="M24 14V36"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M24 14C20 14 13 15 11 17V35C13 33 20 32 24 32"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M24 14C28 14 35 15 37 17V35C35 33 28 32 24 32"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    {/* Bookmark ribbon */}
    <path
      d="M30 17V26L32.5 24L35 26V17"
      fill="white"
      opacity="0.6"
    />
  </svg>
);

const KnowledgeBookWordmark: React.FC<{
  size?: number;
  color?: string;
  textColor?: string;
}> = ({ size = 40, color = BRAND.primary, textColor = 'currentColor' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.3 }}>
    <KnowledgeBookIcon size={size} color={color} />
    <span
      style={{
        fontSize: size * 0.55,
        fontWeight: 600,
        fontFamily: 'Georgia, serif',
        color: textColor,
        letterSpacing: '0.02em',
        fontStyle: 'italic',
      }}
    >
      Marked
    </span>
  </div>
);

// ============================================
// LOGO 3: Abstract M Lettermark
// ============================================
const AbstractMIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 40,
  color = BRAND.primary,
}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="12" fill={color} />
    {/* Stylized M with checkmark integrated */}
    <path
      d="M12 34V18L24 30L36 18V34"
      stroke="white"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

const AbstractMWordmark: React.FC<{
  size?: number;
  color?: string;
  textColor?: string;
}> = ({ size = 40, color = BRAND.primary, textColor = 'currentColor' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.25 }}>
    <AbstractMIcon size={size} color={color} />
    <span
      style={{
        fontSize: size * 0.55,
        fontWeight: 800,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: textColor,
        letterSpacing: '-0.03em',
        textTransform: 'lowercase',
      }}
    >
      marked
    </span>
  </div>
);

// ============================================
// LOGO 4: Folder Organization
// ============================================
const FolderOrgIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 40,
  color = BRAND.primary,
}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="12" fill={color} />
    {/* Stacked folders effect */}
    <rect x="10" y="20" width="28" height="18" rx="3" fill="white" opacity="0.3" />
    <rect x="10" y="16" width="28" height="18" rx="3" fill="white" opacity="0.5" />
    {/* Main folder */}
    <path
      d="M10 15C10 13.8954 10.8954 13 12 13H20L23 16H36C37.1046 16 38 16.8954 38 18V30C38 31.1046 37.1046 32 36 32H12C10.8954 32 10 31.1046 10 30V15Z"
      fill="white"
    />
    {/* Checkmark on folder */}
    <path
      d="M18 23L22 27L30 19"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const FolderOrgWordmark: React.FC<{
  size?: number;
  color?: string;
  textColor?: string;
}> = ({ size = 40, color = BRAND.primary, textColor = 'currentColor' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.3 }}>
    <FolderOrgIcon size={size} color={color} />
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <span
        style={{
          fontSize: size * 0.5,
          fontWeight: 700,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: textColor,
          letterSpacing: '-0.01em',
          lineHeight: 1,
        }}
      >
        Marked
      </span>
      <span
        style={{
          fontSize: size * 0.2,
          fontWeight: 500,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: textColor,
          opacity: 0.5,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
        }}
      >
        Organize
      </span>
    </div>
  </div>
);

// ============================================
// LOGO 5: Link Chain
// ============================================
const LinkChainIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 40,
  color = BRAND.primary,
}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="12" fill={color} />
    {/* Chain links */}
    <path
      d="M20 28L28 20"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <rect
      x="11"
      y="23"
      width="14"
      height="10"
      rx="5"
      transform="rotate(-45 11 23)"
      stroke="white"
      strokeWidth="2.5"
      fill="none"
    />
    <rect
      x="23"
      y="11"
      width="14"
      height="10"
      rx="5"
      transform="rotate(-45 23 11)"
      stroke="white"
      strokeWidth="2.5"
      fill="none"
    />
    {/* Small checkmark accent */}
    <circle cx="36" cy="12" r="6" fill="white" />
    <path
      d="M33 12L35 14L39 10"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const LinkChainWordmark: React.FC<{
  size?: number;
  color?: string;
  textColor?: string;
}> = ({ size = 40, color = BRAND.primary, textColor = 'currentColor' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.3 }}>
    <LinkChainIcon size={size} color={color} />
    <span
      style={{
        fontSize: size * 0.55,
        fontWeight: 600,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: textColor,
        letterSpacing: '0.05em',
      }}
    >
      MARKED
    </span>
  </div>
);

// ============================================
// LOGO 6: Minimal Geometric
// ============================================
const MinimalGeoIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 40,
  color = BRAND.primary,
}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    {/* Clean circle with abstract M */}
    <circle cx="24" cy="24" r="22" fill={color} />
    <path
      d="M14 32V20L24 28L34 20V32"
      stroke="white"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

const MinimalGeoWordmark: React.FC<{
  size?: number;
  color?: string;
  textColor?: string;
}> = ({ size = 40, color = BRAND.primary, textColor = 'currentColor' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.35 }}>
    <MinimalGeoIcon size={size} color={color} />
    <span
      style={{
        fontSize: size * 0.5,
        fontWeight: 300,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: textColor,
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
      }}
    >
      Marked
    </span>
  </div>
);

// ============================================
// LOGO 7: Nature / Leaf (Forest Theme)
// ============================================
const NatureLeafIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 40,
  color = BRAND.primary,
}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="12" fill={color} />
    {/* Leaf shape with vein pattern */}
    <path
      d="M24 10C16 14 12 22 14 32C14 32 18 34 24 34C30 34 34 32 34 32C36 22 32 14 24 10Z"
      fill="white"
      opacity="0.9"
    />
    {/* Center vein */}
    <path
      d="M24 14V30"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
    {/* Side veins */}
    <path
      d="M24 18L18 22M24 22L19 27M24 26L20 30"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M24 18L30 22M24 22L29 27M24 26L28 30"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const NatureLeafWordmark: React.FC<{
  size?: number;
  color?: string;
  textColor?: string;
}> = ({ size = 40, color = BRAND.primary, textColor = 'currentColor' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.25 }}>
    <NatureLeafIcon size={size} color={color} />
    <span
      style={{
        fontSize: size * 0.55,
        fontWeight: 500,
        fontFamily: 'Georgia, serif',
        color: textColor,
        letterSpacing: '0.03em',
      }}
    >
      Marked
    </span>
  </div>
);

// ============================================
// LOGO 8: Brain / Mind Map
// ============================================
const BrainMindIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 40,
  color = BRAND.primary,
}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="12" fill={color} />
    {/* Stylized brain/network */}
    <circle cx="24" cy="16" r="4" fill="white" />
    <circle cx="16" cy="26" r="3" fill="white" />
    <circle cx="32" cy="26" r="3" fill="white" />
    <circle cx="20" cy="35" r="2.5" fill="white" />
    <circle cx="28" cy="35" r="2.5" fill="white" />
    {/* Connections */}
    <path
      d="M24 20V24M20 24L24 24L28 24M24 24V31"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M18.5 28L20 32.5M29.5 28L28 32.5"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
    {/* Spark/idea accent */}
    <path
      d="M30 10L32 8M34 12L36 10M34 16L36 16"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.7"
    />
  </svg>
);

const BrainMindWordmark: React.FC<{
  size?: number;
  color?: string;
  textColor?: string;
}> = ({ size = 40, color = BRAND.primary, textColor = 'currentColor' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.3 }}>
    <BrainMindIcon size={size} color={color} />
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <span
        style={{
          fontSize: size * 0.5,
          fontWeight: 700,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: textColor,
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
        }}
      >
        Marked
      </span>
      <span
        style={{
          fontSize: size * 0.18,
          fontWeight: 400,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: textColor,
          opacity: 0.5,
          letterSpacing: '0.08em',
        }}
      >
        Knowledge Organized
      </span>
    </div>
  </div>
);

// Logo concepts data
const logoConcepts: LogoConcept[] = [
  {
    id: 'checkmark-bookmark',
    name: 'Checkmark Bookmark',
    nameKr: '체크마크 북마크',
    description: '현재 사용 중인 로고. 저장 완료를 의미하는 체크마크를 활용한 직관적인 디자인.',
    Icon: CheckmarkBookmarkIcon,
    Wordmark: CheckmarkBookmarkWordmark,
  },
  {
    id: 'knowledge-book',
    name: 'Knowledge Book',
    nameKr: '지식의 책',
    description: '펼쳐진 책과 북마크 리본을 결합. 지식 정리와 학습의 느낌을 전달.',
    Icon: KnowledgeBookIcon,
    Wordmark: KnowledgeBookWordmark,
  },
  {
    id: 'abstract-m',
    name: 'Abstract M',
    nameKr: '추상적 M',
    description: 'Marked의 M을 체크마크 형태로 스타일화. 미니멀하고 기억에 남는 형태.',
    Icon: AbstractMIcon,
    Wordmark: AbstractMWordmark,
  },
  {
    id: 'folder-org',
    name: 'Folder Organization',
    nameKr: '폴더 정리',
    description: '레이어드 폴더 구조로 체계적 정리를 표현. 조직화 기능을 강조.',
    Icon: FolderOrgIcon,
    Wordmark: FolderOrgWordmark,
  },
  {
    id: 'link-chain',
    name: 'Link Chain',
    nameKr: '링크 체인',
    description: '연결된 링크와 체크마크 뱃지. 웹 링크 관리 서비스의 핵심 기능 표현.',
    Icon: LinkChainIcon,
    Wordmark: LinkChainWordmark,
  },
  {
    id: 'minimal-geo',
    name: 'Minimal Geometric',
    nameKr: '미니멀 지오메트릭',
    description: '원형과 M을 결합한 극도로 심플한 디자인. 다양한 크기에서 선명하게 보임.',
    Icon: MinimalGeoIcon,
    Wordmark: MinimalGeoWordmark,
  },
  {
    id: 'nature-leaf',
    name: 'Nature Leaf',
    nameKr: '자연의 잎',
    description: 'Forest Green 브랜드 컬러와 어울리는 자연적 모티프. 성장과 유기적 정리 표현.',
    Icon: NatureLeafIcon,
    Wordmark: NatureLeafWordmark,
  },
  {
    id: 'brain-mind',
    name: 'Brain Mind Map',
    nameKr: '브레인 마인드맵',
    description: '연결된 노드로 지식 네트워크 표현. 사고의 확장과 연결성 강조.',
    Icon: BrainMindIcon,
    Wordmark: BrainMindWordmark,
  },
];

export default function LogoShowcase() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [selectedLogo, setSelectedLogo] = useState<string | null>(null);
  const [variant, setVariant] = useState<LogoVariant>('wordmark');

  const isDark = theme === 'dark';
  const bg = isDark ? '#0a0f0d' : '#f8faf9';
  const bgCard = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
  const text = isDark ? '#ffffff' : '#111827';
  const textMuted = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';
  const textFaint = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
  const border = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{
        backgroundColor: bg,
        color: text,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Fixed Header */}
      <header
        className="fixed top-0 right-0 left-0 z-50 backdrop-blur-xl"
        style={{
          backgroundColor: isDark ? 'rgba(10,15,13,0.8)' : 'rgba(248,250,249,0.8)',
          borderBottom: `1px solid ${border}`,
        }}
      >
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ backgroundColor: BRAND.primary }}
              >
                <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
                  <path
                    d="M14 24L21 31L34 18"
                    stroke="white"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <span className="text-sm font-semibold">Marked</span>
                <span className="mx-2 text-xs" style={{ color: textFaint }}>
                  /
                </span>
                <span className="text-sm" style={{ color: textMuted }}>
                  Logo Concepts
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Variant Toggle */}
              <div
                className="flex rounded-lg p-1"
                style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
              >
                {(['icon', 'wordmark'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setVariant(v)}
                    className="rounded-md px-3 py-1.5 text-xs font-medium transition-all"
                    style={{
                      backgroundColor: variant === v ? BRAND.primary : 'transparent',
                      color: variant === v ? 'white' : textMuted,
                    }}
                  >
                    {v === 'icon' ? 'Icon' : 'Wordmark'}
                  </button>
                ))}
              </div>

              {/* Theme Toggle */}
              <button
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                  color: textMuted,
                }}
              >
                {isDark ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="5" />
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
                {isDark ? 'Light' : 'Dark'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24">
        <div
          className="absolute top-0 left-1/2 h-[500px] w-[800px] -translate-x-1/2 opacity-20 blur-[100px]"
          style={{ background: `radial-gradient(ellipse, ${BRAND.primary} 0%, transparent 70%)` }}
        />
        <div className="relative mx-auto max-w-7xl px-6 py-16">
          <div className="text-center">
            <div
              className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium"
              style={{
                backgroundColor: `${BRAND.primary}15`,
                color: BRAND.primaryLight,
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: BRAND.primary }} />
              8 Logo Concepts
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
              Logo <span style={{ color: BRAND.primaryLight }}>Exploration</span>
            </h1>
            <p className="mx-auto max-w-xl text-lg" style={{ color: textMuted }}>
              Marked 서비스를 위한 다양한 로고 컨셉을 탐색합니다.
              <br />
              각각의 디자인은 서비스의 핵심 가치를 다른 관점에서 표현합니다.
            </p>
          </div>
        </div>
      </section>

      {/* Logo Grid */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {logoConcepts.map((concept, index) => {
            const isSelected = selectedLogo === concept.id;
            return (
              <button
                key={concept.id}
                onClick={() => setSelectedLogo(isSelected ? null : concept.id)}
                className="group relative overflow-hidden rounded-2xl text-left transition-all duration-300"
                style={{
                  backgroundColor: bgCard,
                  border: `1px solid ${isSelected ? BRAND.primary : border}`,
                  transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                }}
              >
                {/* Card Number */}
                <div
                  className="absolute top-4 left-4 font-mono text-xs"
                  style={{ color: textFaint }}
                >
                  {String(index + 1).padStart(2, '0')}
                </div>

                {/* Logo Display */}
                <div className="flex h-48 items-center justify-center p-8">
                  {variant === 'icon' ? (
                    <concept.Icon size={64} color={BRAND.primary} />
                  ) : (
                    <concept.Wordmark
                      size={48}
                      color={BRAND.primary}
                      textColor={text}
                    />
                  )}
                </div>

                {/* Info Section */}
                <div
                  className="border-t p-4"
                  style={{ borderColor: border }}
                >
                  <h3 className="mb-1 font-semibold">{concept.name}</h3>
                  <p className="mb-2 text-xs" style={{ color: BRAND.primaryLight }}>
                    {concept.nameKr}
                  </p>
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: textMuted }}
                  >
                    {concept.description}
                  </p>
                </div>

                {/* Hover Overlay */}
                <div
                  className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
                  style={{
                    background: `linear-gradient(180deg, transparent 50%, ${BRAND.primary}10 100%)`,
                  }}
                />
              </button>
            );
          })}
        </div>
      </section>

      {/* Detailed View Section */}
      {selectedLogo && (
        <section
          className="border-t"
          style={{ borderColor: border, backgroundColor: bgCard }}
        >
          <div className="mx-auto max-w-7xl px-6 py-16">
            {(() => {
              const concept = logoConcepts.find((c) => c.id === selectedLogo);
              if (!concept) return null;

              return (
                <div>
                  <div className="mb-8 flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">{concept.name}</h2>
                      <p style={{ color: textMuted }}>{concept.nameKr}</p>
                    </div>
                    <button
                      onClick={() => setSelectedLogo(null)}
                      className="rounded-lg px-4 py-2 text-sm"
                      style={{
                        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                        color: textMuted,
                      }}
                    >
                      닫기
                    </button>
                  </div>

                  {/* Size Variations */}
                  <div className="mb-12">
                    <h3 className="mb-4 text-sm font-medium" style={{ color: textFaint }}>
                      SIZE VARIATIONS
                    </h3>
                    <div
                      className="flex flex-wrap items-end gap-8 rounded-xl p-8"
                      style={{
                        backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.8)',
                        border: `1px solid ${border}`,
                      }}
                    >
                      {[80, 64, 48, 40, 32, 24].map((size) => (
                        <div key={size} className="flex flex-col items-center gap-3">
                          <concept.Icon size={size} color={BRAND.primary} />
                          <span className="font-mono text-xs" style={{ color: textFaint }}>
                            {size}px
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Color Variations */}
                  <div className="mb-12">
                    <h3 className="mb-4 text-sm font-medium" style={{ color: textFaint }}>
                      COLOR VARIATIONS
                    </h3>
                    <div className="grid gap-4 md:grid-cols-4">
                      {/* Primary on Dark */}
                      <div
                        className="flex h-40 flex-col items-center justify-center rounded-xl"
                        style={{ backgroundColor: '#111827' }}
                      >
                        <concept.Wordmark size={36} color={BRAND.primary} textColor="#ffffff" />
                        <span className="mt-3 text-xs text-white/50">Dark Background</span>
                      </div>

                      {/* Primary on Light */}
                      <div
                        className="flex h-40 flex-col items-center justify-center rounded-xl border"
                        style={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb' }}
                      >
                        <concept.Wordmark size={36} color={BRAND.primary} textColor="#111827" />
                        <span className="mt-3 text-xs text-gray-400">Light Background</span>
                      </div>

                      {/* Monochrome White */}
                      <div
                        className="flex h-40 flex-col items-center justify-center rounded-xl"
                        style={{ backgroundColor: BRAND.primary }}
                      >
                        <concept.Icon size={48} color="rgba(255,255,255,0.2)" />
                        <div className="absolute">
                          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                            <rect width="48" height="48" rx="12" fill="white" />
                          </svg>
                        </div>
                        <span className="mt-3 text-xs text-white/70">On Brand Color</span>
                      </div>

                      {/* Grayscale */}
                      <div
                        className="flex h-40 flex-col items-center justify-center rounded-xl"
                        style={{ backgroundColor: '#f3f4f6' }}
                      >
                        <concept.Wordmark size={36} color="#6b7280" textColor="#374151" />
                        <span className="mt-3 text-xs text-gray-400">Grayscale</span>
                      </div>
                    </div>
                  </div>

                  {/* Wordmark Variations */}
                  <div>
                    <h3 className="mb-4 text-sm font-medium" style={{ color: textFaint }}>
                      WORDMARK VARIATIONS
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div
                        className="flex h-32 items-center justify-center rounded-xl"
                        style={{
                          backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.8)',
                          border: `1px solid ${border}`,
                        }}
                      >
                        <concept.Wordmark size={48} color={BRAND.primary} textColor={text} />
                      </div>
                      <div
                        className="flex h-32 items-center justify-center rounded-xl"
                        style={{
                          backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.8)',
                          border: `1px solid ${border}`,
                        }}
                      >
                        <concept.Icon size={64} color={BRAND.primary} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t px-6 py-8" style={{ borderColor: border }}>
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <p className="text-sm" style={{ color: textFaint }}>
              Marked Logo Exploration — Design Concepts
            </p>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: BRAND.primary }} />
              <span className="text-xs" style={{ color: textMuted }}>
                Forest Green Theme
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
