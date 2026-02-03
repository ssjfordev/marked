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
// 2026 트렌드 기반 새로운 로고들
// ============================================

// 1. 소프트 리본 - 부드럽고 따뜻한 느낌
const SoftRibbonIcon: React.FC<{ size?: number; color?: string }> = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <defs>
      <linearGradient id="softRibbon" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#34D399" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>
    <rect width="48" height="48" rx="14" fill="url(#softRibbon)" />
    {/* 부드러운 곡선의 리본 북마크 */}
    <path
      d="M15 11C15 9.89543 15.8954 9 17 9H31C32.1046 9 33 9.89543 33 11V37C33 37.8284 32.0284 38.2842 31.4 37.7L24 32L16.6 37.7C15.9716 38.2842 15 37.8284 15 37V11Z"
      fill="white"
    />
  </svg>
);

const SoftRibbonWordmark: React.FC<{ size?: number; color?: string; textColor?: string }> = ({
  size = 40,
  textColor = 'currentColor',
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.3 }}>
    <SoftRibbonIcon size={size} />
    <span
      style={{
        fontSize: size * 0.55,
        fontWeight: 600,
        fontFamily: 'system-ui',
        color: textColor,
        letterSpacing: '-0.01em',
      }}
    >
      Marked
    </span>
  </div>
);

// 2. 플래그 탭 - 탭/태그 느낌
const FlagTabIcon: React.FC<{ size?: number; color?: string }> = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <defs>
      <linearGradient id="flagTab" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#6EE7B7" />
        <stop offset="100%" stopColor="#047857" />
      </linearGradient>
    </defs>
    <rect width="48" height="48" rx="14" fill="url(#flagTab)" />
    {/* 깃발/탭 형태 - 오른쪽으로 뻗은 */}
    <path d="M12 12H32L28 24L32 36H12V12Z" fill="white" />
  </svg>
);

const FlagTabWordmark: React.FC<{ size?: number; color?: string; textColor?: string }> = ({
  size = 40,
  textColor = 'currentColor',
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.3 }}>
    <FlagTabIcon size={size} />
    <span
      style={{
        fontSize: size * 0.55,
        fontWeight: 700,
        fontFamily: 'system-ui',
        color: textColor,
        letterSpacing: '-0.02em',
      }}
    >
      Marked
    </span>
  </div>
);

// 3. 코너마크 - 페이지 접힌 모서리
const CornerMarkIcon: React.FC<{ size?: number; color?: string }> = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <defs>
      <linearGradient id="cornerMark" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#065F46" />
      </linearGradient>
    </defs>
    <rect width="48" height="48" rx="14" fill="url(#cornerMark)" />
    {/* 접힌 모서리 */}
    <path
      d="M10 14C10 11.7909 11.7909 10 14 10H26L38 22V34C38 36.2091 36.2091 38 34 38H14C11.7909 38 10 36.2091 10 34V14Z"
      fill="white"
    />
    <path d="M26 10V18C26 20.2091 27.7909 22 30 22H38" fill="white" fillOpacity="0.5" />
  </svg>
);

const CornerMarkWordmark: React.FC<{ size?: number; color?: string; textColor?: string }> = ({
  size = 40,
  textColor = 'currentColor',
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.3 }}>
    <CornerMarkIcon size={size} />
    <span
      style={{
        fontSize: size * 0.55,
        fontWeight: 600,
        fontFamily: 'system-ui',
        color: textColor,
        letterSpacing: '-0.01em',
      }}
    >
      Marked
    </span>
  </div>
);

// 4. 드롭 핀 - Raindrop 스타일 영감
const DropPinIcon: React.FC<{ size?: number; color?: string }> = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <defs>
      <linearGradient id="dropPin" x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stopColor="#34D399" />
        <stop offset="100%" stopColor="#047857" />
      </linearGradient>
    </defs>
    <rect width="48" height="48" rx="14" fill="url(#dropPin)" />
    {/* 물방울/핀 형태 */}
    <path
      d="M24 8C24 8 12 20 12 28C12 34.6274 17.3726 40 24 40C30.6274 40 36 34.6274 36 28C36 20 24 8 24 8Z"
      fill="white"
    />
  </svg>
);

const DropPinWordmark: React.FC<{ size?: number; color?: string; textColor?: string }> = ({
  size = 40,
  textColor = 'currentColor',
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.3 }}>
    <DropPinIcon size={size} />
    <span
      style={{
        fontSize: size * 0.55,
        fontWeight: 600,
        fontFamily: 'system-ui',
        color: textColor,
        letterSpacing: '-0.01em',
      }}
    >
      Marked
    </span>
  </div>
);

// 5. 라운드 태그 - 원형에 가까운 태그
const RoundTagIcon: React.FC<{ size?: number; color?: string }> = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <defs>
      <linearGradient id="roundTag" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6EE7B7" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>
    <rect width="48" height="48" rx="14" fill="url(#roundTag)" />
    {/* 라운드 태그/라벨 */}
    <circle cx="24" cy="24" r="14" fill="white" />
    <circle cx="24" cy="24" r="5" fill="url(#roundTag)" />
  </svg>
);

const RoundTagWordmark: React.FC<{ size?: number; color?: string; textColor?: string }> = ({
  size = 40,
  textColor = 'currentColor',
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.3 }}>
    <RoundTagIcon size={size} />
    <span
      style={{
        fontSize: size * 0.55,
        fontWeight: 600,
        fontFamily: 'system-ui',
        color: textColor,
        letterSpacing: '-0.01em',
      }}
    >
      Marked
    </span>
  </div>
);

// 6. 스퀘어 북마크 - 정사각형 + V컷
const SquareBookmarkIcon: React.FC<{ size?: number; color?: string }> = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <defs>
      <linearGradient id="squareBm" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#047857" />
      </linearGradient>
    </defs>
    <rect width="48" height="48" rx="14" fill="url(#squareBm)" />
    {/* 정사각형에 V컷 */}
    <path d="M12 12H36V32L24 26L12 32V12Z" fill="white" />
  </svg>
);

const SquareBookmarkWordmark: React.FC<{ size?: number; color?: string; textColor?: string }> = ({
  size = 40,
  textColor = 'currentColor',
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.3 }}>
    <SquareBookmarkIcon size={size} />
    <span
      style={{
        fontSize: size * 0.55,
        fontWeight: 700,
        fontFamily: 'system-ui',
        color: textColor,
        letterSpacing: '-0.02em',
      }}
    >
      Marked
    </span>
  </div>
);

// 7. 네거티브 리본 - 반전된 형태
const NegativeRibbonIcon: React.FC<{ size?: number; color?: string }> = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <defs>
      <linearGradient id="negRibbon" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#34D399" />
        <stop offset="100%" stopColor="#065F46" />
      </linearGradient>
    </defs>
    <rect width="48" height="48" rx="14" fill="white" />
    {/* 네거티브 스페이스 북마크 */}
    <path d="M14 8V40L24 32L34 40V8H14Z" fill="url(#negRibbon)" />
  </svg>
);

const NegativeRibbonWordmark: React.FC<{ size?: number; color?: string; textColor?: string }> = ({
  size = 40,
  textColor = 'currentColor',
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.3 }}>
    <NegativeRibbonIcon size={size} />
    <span
      style={{
        fontSize: size * 0.55,
        fontWeight: 700,
        fontFamily: 'system-ui',
        color: textColor,
        letterSpacing: '-0.02em',
      }}
    >
      Marked
    </span>
  </div>
);

// 8. 글로우 도트 - Spotify 스타일 영감
const GlowDotIcon: React.FC<{ size?: number; color?: string }> = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <defs>
      <linearGradient id="glowDot" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#047857" />
      </linearGradient>
      <radialGradient id="innerGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="white" />
        <stop offset="100%" stopColor="white" stopOpacity="0.8" />
      </radialGradient>
    </defs>
    <rect width="48" height="48" rx="14" fill="url(#glowDot)" />
    {/* 심플한 원 - 포인트/마크 */}
    <circle cx="24" cy="24" r="12" fill="url(#innerGlow)" />
  </svg>
);

const GlowDotWordmark: React.FC<{ size?: number; color?: string; textColor?: string }> = ({
  size = 40,
  textColor = 'currentColor',
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.3 }}>
    <GlowDotIcon size={size} />
    <span
      style={{
        fontSize: size * 0.55,
        fontWeight: 600,
        fontFamily: 'system-ui',
        color: textColor,
        letterSpacing: '-0.01em',
      }}
    >
      Marked
    </span>
  </div>
);

// ============================================
// LOGO 1: Marked Pin (핀 + 체크 합성)
// ============================================
const MarkedPinIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 40,
  color = BRAND.primary,
}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="12" fill={color} />
    {/* 핀 형태 + 체크가 합쳐진 심볼 */}
    <path d="M24 8L24 28" stroke="white" strokeWidth="3" strokeLinecap="round" />
    <path
      d="M16 20L24 28L36 16"
      stroke="white"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="24" cy="38" r="3" fill="white" />
  </svg>
);

// ============================================
// LOGO 1-B: Original Checkmark (기존)
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

const MarkedPinWordmark: React.FC<{
  size?: number;
  color?: string;
  textColor?: string;
}> = ({ size = 40, color = BRAND.primary, textColor = 'currentColor' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.3 }}>
    <MarkedPinIcon size={size} color={color} />
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
    <path d="M24 14V36" stroke="white" strokeWidth="2" strokeLinecap="round" />
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
    <path d="M30 17V26L32.5 24L35 26V17" fill="white" opacity="0.6" />
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
    <path d="M20 28L28 20" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
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
    <path d="M24 14V30" stroke={color} strokeWidth="2" strokeLinecap="round" />
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
// LOGO 8: Ribbon Mark (리본 + 각진 체크)
// ============================================
const RibbonMarkIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 40,
  color = BRAND.primary,
}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="12" fill={color} />
    {/* 리본 형태의 북마크 + 비대칭 체크 */}
    <path d="M14 10V38L24 30L34 38V10" fill="white" opacity="0.3" />
    <path
      d="M14 10V38L24 30L34 38V10H14Z"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M18 22L23 27L32 16"
      stroke="white"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const RibbonMarkWordmark: React.FC<{
  size?: number;
  color?: string;
  textColor?: string;
}> = ({ size = 40, color = BRAND.primary, textColor = 'currentColor' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.3 }}>
    <RibbonMarkIcon size={size} color={color} />
    <span
      style={{
        fontSize: size * 0.55,
        fontWeight: 600,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: textColor,
        letterSpacing: '-0.01em',
      }}
    >
      Marked
    </span>
  </div>
);

// ============================================
// LOGO 9: Corner Fold (접힌 페이지)
// ============================================
const CornerFoldIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 40,
  color = BRAND.primary,
}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="12" fill={color} />
    {/* 접힌 종이 코너 */}
    <path d="M12 12H28L36 20V36H12V12Z" fill="white" opacity="0.9" />
    <path d="M28 12V20H36" fill="white" opacity="0.5" />
    <path d="M28 12L36 20" stroke={color} strokeWidth="1" opacity="0.3" />
    {/* 비대칭 체크마크 */}
    <path
      d="M17 25L22 30L31 19"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CornerFoldWordmark: React.FC<{
  size?: number;
  color?: string;
  textColor?: string;
}> = ({ size = 40, color = BRAND.primary, textColor = 'currentColor' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.3 }}>
    <CornerFoldIcon size={size} color={color} />
    <span
      style={{
        fontSize: size * 0.55,
        fontWeight: 600,
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
// LOGO 10: Spark Check (스파크 + 체크)
// ============================================
const SparkCheckIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 40,
  color = BRAND.primary,
}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="12" fill={color} />
    {/* 스파크/별 형태의 악센트 */}
    <path
      d="M34 8L35.5 14L42 12L36 16L40 22L34 18L32 24L32 17L26 18L32 14L34 8Z"
      fill="white"
      opacity="0.6"
    />
    {/* 둥근 체크 (V가 아닌 곡선) */}
    <path
      d="M10 26C14 30 18 34 22 34C28 34 34 22 38 16"
      stroke="white"
      strokeWidth="4"
      strokeLinecap="round"
    />
  </svg>
);

const SparkCheckWordmark: React.FC<{
  size?: number;
  color?: string;
  textColor?: string;
}> = ({ size = 40, color = BRAND.primary, textColor = 'currentColor' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.3 }}>
    <SparkCheckIcon size={size} color={color} />
    <span
      style={{
        fontSize: size * 0.55,
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
// LOGO 11: Arrow Bookmark (화살표 북마크)
// ============================================
const ArrowBookmarkIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 40,
  color = BRAND.primary,
}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="12" fill={color} />
    {/* 아래를 향하는 화살표 + 체크 합성 */}
    <path d="M24 10V30" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
    <path
      d="M14 22L24 32L34 22"
      stroke="white"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M14 38H34" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
  </svg>
);

const ArrowBookmarkWordmark: React.FC<{
  size?: number;
  color?: string;
  textColor?: string;
}> = ({ size = 40, color = BRAND.primary, textColor = 'currentColor' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.3 }}>
    <ArrowBookmarkIcon size={size} color={color} />
    <span
      style={{
        fontSize: size * 0.55,
        fontWeight: 600,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: textColor,
        letterSpacing: '-0.01em',
      }}
    >
      Marked
    </span>
  </div>
);

// ============================================
// LOGO 12: Stack Layers (레이어 스택)
// ============================================
const StackLayersIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 40,
  color = BRAND.primary,
}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="12" fill={color} />
    {/* 3개 레이어 스택 */}
    <path d="M24 10L38 18L24 26L10 18L24 10Z" fill="white" opacity="0.9" />
    <path
      d="M10 24L24 32L38 24"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.6"
    />
    <path
      d="M10 30L24 38L38 30"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.4"
    />
  </svg>
);

const StackLayersWordmark: React.FC<{
  size?: number;
  color?: string;
  textColor?: string;
}> = ({ size = 40, color = BRAND.primary, textColor = 'currentColor' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.3 }}>
    <StackLayersIcon size={size} color={color} />
    <span
      style={{
        fontSize: size * 0.55,
        fontWeight: 600,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: textColor,
        letterSpacing: '-0.01em',
      }}
    >
      Marked
    </span>
  </div>
);

// ============================================
// LOGO 13: Signal Wave (시그널 웨이브)
// ============================================
const SignalWaveIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 40,
  color = BRAND.primary,
}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="12" fill={color} />
    {/* 체크와 시그널의 합성 */}
    <path
      d="M10 28C14 28 14 20 18 20C22 20 22 28 26 28C30 28 30 14 34 14C38 14 38 24 42 24"
      stroke="white"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="38" cy="34" r="4" fill="white" opacity="0.5" />
  </svg>
);

const SignalWaveWordmark: React.FC<{
  size?: number;
  color?: string;
  textColor?: string;
}> = ({ size = 40, color = BRAND.primary, textColor = 'currentColor' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.3 }}>
    <SignalWaveIcon size={size} color={color} />
    <span
      style={{
        fontSize: size * 0.55,
        fontWeight: 600,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: textColor,
        letterSpacing: '-0.01em',
      }}
    >
      Marked
    </span>
  </div>
);

// ============================================
// LOGO 14: Target Pin (타겟 핀)
// ============================================
const TargetPinIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 40,
  color = BRAND.primary,
}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="12" fill={color} />
    {/* 동심원 + 체크 포인트 */}
    <circle cx="24" cy="22" r="14" stroke="white" strokeWidth="2.5" fill="none" opacity="0.4" />
    <circle cx="24" cy="22" r="8" stroke="white" strokeWidth="2.5" fill="none" opacity="0.7" />
    <circle cx="24" cy="22" r="3" fill="white" />
    {/* 아래로 향하는 포인터 */}
    <path d="M24 36V42" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
  </svg>
);

const TargetPinWordmark: React.FC<{
  size?: number;
  color?: string;
  textColor?: string;
}> = ({ size = 40, color = BRAND.primary, textColor = 'currentColor' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.3 }}>
    <TargetPinIcon size={size} color={color} />
    <span
      style={{
        fontSize: size * 0.55,
        fontWeight: 600,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: textColor,
        letterSpacing: '-0.01em',
      }}
    >
      Marked
    </span>
  </div>
);

// ============================================
// LOGO 15: Bracket Mark (브래킷 마크)
// ============================================
const BracketMarkIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 40,
  color = BRAND.primary,
}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="12" fill={color} />
    {/* 코드 브래킷 스타일 체크 */}
    <path
      d="M12 14L8 24L12 34"
      stroke="white"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.5"
    />
    <path
      d="M36 14L40 24L36 34"
      stroke="white"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.5"
    />
    {/* 중앙 체크 */}
    <path
      d="M17 24L22 29L31 18"
      stroke="white"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const BracketMarkWordmark: React.FC<{
  size?: number;
  color?: string;
  textColor?: string;
}> = ({ size = 40, color = BRAND.primary, textColor = 'currentColor' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.3 }}>
    <BracketMarkIcon size={size} color={color} />
    <span
      style={{
        fontSize: size * 0.55,
        fontWeight: 600,
        fontFamily: 'SF Mono, Monaco, monospace',
        color: textColor,
        letterSpacing: '-0.02em',
      }}
    >
      Marked
    </span>
  </div>
);

// ============================================
// LOGO 16: Brain / Mind Map
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
    id: 'soft-ribbon',
    name: 'Soft Ribbon',
    nameKr: '소프트 리본',
    description: '부드러운 곡선의 책갈피. 따뜻하고 친근한 느낌.',
    Icon: SoftRibbonIcon,
    Wordmark: SoftRibbonWordmark,
  },
  {
    id: 'flag-tab',
    name: 'Flag Tab',
    nameKr: '플래그 탭',
    description: '옆으로 뻗은 태그/깃발 형태. 독특하고 인상적.',
    Icon: FlagTabIcon,
    Wordmark: FlagTabWordmark,
  },
  {
    id: 'corner-mark',
    name: 'Corner Mark',
    nameKr: '코너 마크',
    description: '접힌 페이지 모서리. 저장의 직관적 표현.',
    Icon: CornerMarkIcon,
    Wordmark: CornerMarkWordmark,
  },
  {
    id: 'drop-pin',
    name: 'Drop Pin',
    nameKr: '드롭 핀',
    description: '물방울/핀 형태. Raindrop 스타일 영감.',
    Icon: DropPinIcon,
    Wordmark: DropPinWordmark,
  },
  {
    id: 'round-tag',
    name: 'Round Tag',
    nameKr: '라운드 태그',
    description: '원형 태그/라벨. 미니멀하고 현대적.',
    Icon: RoundTagIcon,
    Wordmark: RoundTagWordmark,
  },
  {
    id: 'square-bookmark',
    name: 'Square Bookmark',
    nameKr: '스퀘어 북마크',
    description: '정사각형에 V컷. 깔끔하고 단단한 느낌.',
    Icon: SquareBookmarkIcon,
    Wordmark: SquareBookmarkWordmark,
  },
  {
    id: 'negative-ribbon',
    name: 'Negative Ribbon',
    nameKr: '네거티브 리본',
    description: '흰 배경에 그린 북마크. 반전된 독특한 스타일.',
    Icon: NegativeRibbonIcon,
    Wordmark: NegativeRibbonWordmark,
  },
  {
    id: 'glow-dot',
    name: 'Glow Dot',
    nameKr: '글로우 도트',
    description: '심플한 원형 포인트. Spotify 스타일 영감.',
    Icon: GlowDotIcon,
    Wordmark: GlowDotWordmark,
  },
  {
    id: 'marked-pin',
    name: 'Marked Pin',
    nameKr: '마크드 핀',
    description: '핀과 체크마크를 합성한 심볼. 위치를 표시하고 완료를 알리는 이중 의미.',
    Icon: MarkedPinIcon,
    Wordmark: MarkedPinWordmark,
  },
  {
    id: 'ribbon-mark',
    name: 'Ribbon Mark',
    nameKr: '리본 마크',
    description: '책갈피 리본과 체크마크의 조합. 북마크 기능을 직관적으로 표현.',
    Icon: RibbonMarkIcon,
    Wordmark: RibbonMarkWordmark,
  },
  {
    id: 'corner-fold',
    name: 'Corner Fold',
    nameKr: '코너 폴드',
    description: '접힌 페이지 모서리로 저장을 표현. 체크마크가 문서 내에 위치.',
    Icon: CornerFoldIcon,
    Wordmark: CornerFoldWordmark,
  },
  {
    id: 'spark-check',
    name: 'Spark Check',
    nameKr: '스파크 체크',
    description: '곡선형 체크에 스파크 악센트. 완료의 기쁨과 특별함을 표현.',
    Icon: SparkCheckIcon,
    Wordmark: SparkCheckWordmark,
  },
  {
    id: 'arrow-bookmark',
    name: 'Arrow Bookmark',
    nameKr: '애로우 북마크',
    description: '아래로 향하는 화살표로 저장 동작을 표현. 간결하고 동적인 느낌.',
    Icon: ArrowBookmarkIcon,
    Wordmark: ArrowBookmarkWordmark,
  },
  {
    id: 'stack-layers',
    name: 'Stack Layers',
    nameKr: '스택 레이어',
    description: '3D 레이어 스택으로 정리된 컬렉션을 표현. 조직화의 느낌.',
    Icon: StackLayersIcon,
    Wordmark: StackLayersWordmark,
  },
  {
    id: 'signal-wave',
    name: 'Signal Wave',
    nameKr: '시그널 웨이브',
    description: '상승하는 웨이브로 성장과 진행을 표현. 동적이고 현대적인 느낌.',
    Icon: SignalWaveIcon,
    Wordmark: SignalWaveWordmark,
  },
  {
    id: 'target-pin',
    name: 'Target Pin',
    nameKr: '타겟 핀',
    description: '동심원과 핀의 조합. 정확한 저장 위치를 표현하는 미니멀 디자인.',
    Icon: TargetPinIcon,
    Wordmark: TargetPinWordmark,
  },
  {
    id: 'bracket-mark',
    name: 'Bracket Mark',
    nameKr: '브래킷 마크',
    description: '코드 브래킷과 체크마크의 조합. 개발자 친화적인 느낌.',
    Icon: BracketMarkIcon,
    Wordmark: BracketMarkWordmark,
  },
  {
    id: 'checkmark-bookmark',
    name: 'Checkmark (Original)',
    nameKr: '체크마크 (기존)',
    description: '기존 사용 중인 로고. 단순한 체크마크 디자인.',
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
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="5" />
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                  </svg>
                ) : (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
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
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: BRAND.primary }}
              />
              {logoConcepts.length} Logo Concepts
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
                    <concept.Wordmark size={48} color={BRAND.primary} textColor={text} />
                  )}
                </div>

                {/* Info Section */}
                <div className="border-t p-4" style={{ borderColor: border }}>
                  <h3 className="mb-1 font-semibold">{concept.name}</h3>
                  <p className="mb-2 text-xs" style={{ color: BRAND.primaryLight }}>
                    {concept.nameKr}
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: textMuted }}>
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
        <section className="border-t" style={{ borderColor: border, backgroundColor: bgCard }}>
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
