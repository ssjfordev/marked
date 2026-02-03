'use client';

import { useState } from 'react';

const BRAND_COLOR = '#059669';

type LogoDesign = {
  id: string;
  name: string;
  description: string;
  Icon: React.FC<{ size?: number }>;
};

// ============================================
// 1. Ribbon Bookmark - Classic bookmark shape
// ============================================
const RibbonBookmarkIcon: React.FC<{ size?: number }> = ({ size = 64 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <rect width="64" height="64" rx="14" fill={BRAND_COLOR} />
    <path d="M20 14H44V50L32 42L20 50V14Z" fill="white" />
  </svg>
);

// ============================================
// 2. Rounded Bookmark - Softer variant
// ============================================
const RoundedBookmarkIcon: React.FC<{ size?: number }> = ({ size = 64 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <rect width="64" height="64" rx="14" fill={BRAND_COLOR} />
    <path
      d="M18 16C18 14.3431 19.3431 13 21 13H43C44.6569 13 46 14.3431 46 16V51L32 42L18 51V16Z"
      fill="white"
    />
  </svg>
);

// ============================================
// 3. Simple Checkmark - Bold check
// ============================================
const SimpleCheckIcon: React.FC<{ size?: number }> = ({ size = 64 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <rect width="64" height="64" rx="14" fill={BRAND_COLOR} />
    <path
      d="M18 33L27 42L46 22"
      stroke="white"
      strokeWidth="6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ============================================
// 4. Bookmark with Check - Combined symbol
// ============================================
const BookmarkCheckIcon: React.FC<{ size?: number }> = ({ size = 64 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <rect width="64" height="64" rx="14" fill={BRAND_COLOR} />
    <path d="M18 12H46V52L32 43L18 52V12Z" fill="white" />
    <path
      d="M24 30L29 35L40 24"
      stroke={BRAND_COLOR}
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ============================================
// 5. Abstract M - Letter form
// ============================================
const AbstractMIcon: React.FC<{ size?: number }> = ({ size = 64 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <rect width="64" height="64" rx="14" fill={BRAND_COLOR} />
    <path
      d="M16 46V24L32 38L48 24V46"
      stroke="white"
      strokeWidth="6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ============================================
// 6. Minimal Bookmark - Thin line
// ============================================
const MinimalBookmarkIcon: React.FC<{ size?: number }> = ({ size = 64 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <rect width="64" height="64" rx="14" fill={BRAND_COLOR} />
    <path
      d="M20 12V52L32 43L44 52V12H20Z"
      stroke="white"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

// ============================================
// 7. Pin Mark - Location pin style
// ============================================
const PinMarkIcon: React.FC<{ size?: number }> = ({ size = 64 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <rect width="64" height="64" rx="14" fill={BRAND_COLOR} />
    <circle cx="32" cy="26" r="10" fill="white" />
    <path d="M32 36L32 52" stroke="white" strokeWidth="5" strokeLinecap="round" />
  </svg>
);

// ============================================
// 8. Tag Shape - Price tag style
// ============================================
const TagShapeIcon: React.FC<{ size?: number }> = ({ size = 64 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <rect width="64" height="64" rx="14" fill={BRAND_COLOR} />
    <path d="M14 18L14 34L32 52L50 34L50 18L14 18Z" fill="white" />
    <circle cx="24" cy="28" r="4" fill={BRAND_COLOR} />
  </svg>
);

// ============================================
// 9. Stack Layers - Organized layers
// ============================================
const StackLayersIcon: React.FC<{ size?: number }> = ({ size = 64 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <rect width="64" height="64" rx="14" fill={BRAND_COLOR} />
    <path d="M32 14L50 24L32 34L14 24L32 14Z" fill="white" />
    <path
      d="M14 32L32 42L50 32"
      stroke="white"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14 40L32 50L50 40"
      stroke="white"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.6"
    />
  </svg>
);

// ============================================
// 10. Corner Fold - Folded page
// ============================================
const CornerFoldIcon: React.FC<{ size?: number }> = ({ size = 64 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <rect width="64" height="64" rx="14" fill={BRAND_COLOR} />
    <path d="M14 14H38L50 26V50H14V14Z" fill="white" />
    <path d="M38 14V26H50" fill="white" opacity="0.5" />
  </svg>
);

// ============================================
// 11. Circle Mark - Minimal circle
// ============================================
const CircleMarkIcon: React.FC<{ size?: number }> = ({ size = 64 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <rect width="64" height="64" rx="14" fill={BRAND_COLOR} />
    <circle cx="32" cy="32" r="16" fill="white" />
  </svg>
);

// ============================================
// 12. Plus Bookmark - Add action
// ============================================
const PlusBookmarkIcon: React.FC<{ size?: number }> = ({ size = 64 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <rect width="64" height="64" rx="14" fill={BRAND_COLOR} />
    <path d="M32 18V46" stroke="white" strokeWidth="6" strokeLinecap="round" />
    <path d="M18 32H46" stroke="white" strokeWidth="6" strokeLinecap="round" />
  </svg>
);

const logoDesigns: LogoDesign[] = [
  {
    id: 'ribbon-bookmark',
    name: 'Ribbon Bookmark',
    description: 'Classic bookmark ribbon shape. Clean and recognizable.',
    Icon: RibbonBookmarkIcon,
  },
  {
    id: 'rounded-bookmark',
    name: 'Rounded Bookmark',
    description: 'Softer bookmark with rounded top corners.',
    Icon: RoundedBookmarkIcon,
  },
  {
    id: 'simple-check',
    name: 'Simple Check',
    description: 'Bold checkmark representing "marked" as done.',
    Icon: SimpleCheckIcon,
  },
  {
    id: 'bookmark-check',
    name: 'Bookmark + Check',
    description: 'Bookmark with integrated checkmark inside.',
    Icon: BookmarkCheckIcon,
  },
  {
    id: 'abstract-m',
    name: 'Abstract M',
    description: 'Stylized M letter that resembles a checkmark.',
    Icon: AbstractMIcon,
  },
  {
    id: 'minimal-bookmark',
    name: 'Minimal Bookmark',
    description: 'Outline-only bookmark for a lighter feel.',
    Icon: MinimalBookmarkIcon,
  },
  {
    id: 'pin-mark',
    name: 'Pin Mark',
    description: 'Location pin representing saved places.',
    Icon: PinMarkIcon,
  },
  {
    id: 'tag-shape',
    name: 'Tag Shape',
    description: 'Tag or label shape for organizing content.',
    Icon: TagShapeIcon,
  },
  {
    id: 'stack-layers',
    name: 'Stack Layers',
    description: 'Layered shapes representing organized collections.',
    Icon: StackLayersIcon,
  },
  {
    id: 'corner-fold',
    name: 'Corner Fold',
    description: 'Folded page corner representing saved pages.',
    Icon: CornerFoldIcon,
  },
  {
    id: 'circle-mark',
    name: 'Circle Mark',
    description: 'Ultra minimal circle dot mark.',
    Icon: CircleMarkIcon,
  },
  {
    id: 'plus-bookmark',
    name: 'Plus Bookmark',
    description: 'Plus sign representing adding bookmarks.',
    Icon: PlusBookmarkIcon,
  },
];

export default function BrandingNewPage() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: '#0a0f0d',
        color: '#ffffff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Header */}
      <header className="border-b border-white/10 px-8 py-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center gap-3">
            <RibbonBookmarkIcon size={32} />
            <span className="text-lg font-semibold">Marked</span>
            <span className="mx-2 text-white/30">/</span>
            <span className="text-white/60">Branding</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-white/10 px-8 py-16">
        <div className="mx-auto max-w-6xl text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight">App Icon Concepts</h1>
          <p className="mx-auto max-w-lg text-lg text-white/60">
            Simple, flat vector logos optimized for app icons and favicons.
            <br />
            Using brand color <span style={{ color: BRAND_COLOR }}>#059669</span>
          </p>
        </div>
      </section>

      {/* Logo Grid */}
      <section className="px-8 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {logoDesigns.map((design) => {
              const isSelected = selected === design.id;
              return (
                <button
                  key={design.id}
                  onClick={() => setSelected(isSelected ? null : design.id)}
                  className="group rounded-2xl p-6 text-left transition-all"
                  style={{
                    backgroundColor: isSelected
                      ? 'rgba(5, 150, 105, 0.15)'
                      : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${isSelected ? BRAND_COLOR : 'rgba(255, 255, 255, 0.1)'}`,
                  }}
                >
                  <div className="mb-4 flex justify-center">
                    <design.Icon size={80} />
                  </div>
                  <h3 className="mb-1 text-center font-semibold">{design.name}</h3>
                  <p className="text-center text-sm text-white/50">{design.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Size Preview */}
      {selected && (
        <section className="border-t border-white/10 px-8 py-16">
          <div className="mx-auto max-w-6xl">
            {(() => {
              const design = logoDesigns.find((d) => d.id === selected);
              if (!design) return null;

              return (
                <div>
                  <div className="mb-8 flex items-center justify-between">
                    <h2 className="text-2xl font-bold">{design.name}</h2>
                    <button
                      onClick={() => setSelected(null)}
                      className="rounded-lg px-4 py-2 text-sm text-white/60 transition-colors hover:bg-white/5"
                    >
                      Close
                    </button>
                  </div>

                  {/* Size Variations */}
                  <div className="mb-12">
                    <h3 className="mb-6 text-sm font-medium uppercase tracking-wider text-white/40">
                      Size Variations
                    </h3>
                    <div className="flex flex-wrap items-end gap-8 rounded-2xl bg-white/5 p-8">
                      {[128, 96, 64, 48, 32, 24, 16].map((size) => (
                        <div key={size} className="flex flex-col items-center gap-3">
                          <design.Icon size={size} />
                          <span className="font-mono text-xs text-white/40">{size}px</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Background Variations */}
                  <div className="mb-12">
                    <h3 className="mb-6 text-sm font-medium uppercase tracking-wider text-white/40">
                      Background Variations
                    </h3>
                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="flex h-40 flex-col items-center justify-center rounded-2xl bg-black">
                        <design.Icon size={64} />
                        <span className="mt-3 text-xs text-white/40">Black</span>
                      </div>
                      <div className="flex h-40 flex-col items-center justify-center rounded-2xl bg-white">
                        <design.Icon size={64} />
                        <span className="mt-3 text-xs text-gray-400">White</span>
                      </div>
                      <div className="flex h-40 flex-col items-center justify-center rounded-2xl bg-gray-100">
                        <design.Icon size={64} />
                        <span className="mt-3 text-xs text-gray-400">Light Gray</span>
                      </div>
                      <div className="flex h-40 flex-col items-center justify-center rounded-2xl bg-gray-800">
                        <design.Icon size={64} />
                        <span className="mt-3 text-xs text-white/40">Dark Gray</span>
                      </div>
                    </div>
                  </div>

                  {/* App Icon Mockup */}
                  <div>
                    <h3 className="mb-6 text-sm font-medium uppercase tracking-wider text-white/40">
                      App Icon Preview
                    </h3>
                    <div className="flex flex-wrap items-center gap-8 rounded-2xl bg-white/5 p-8">
                      {/* iOS Style */}
                      <div className="flex flex-col items-center gap-3">
                        <div
                          className="overflow-hidden"
                          style={{
                            borderRadius: '22.5%',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                          }}
                        >
                          <design.Icon size={80} />
                        </div>
                        <span className="text-xs text-white/40">iOS</span>
                      </div>

                      {/* Android Style */}
                      <div className="flex flex-col items-center gap-3">
                        <div
                          className="overflow-hidden rounded-full"
                          style={{
                            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                          }}
                        >
                          <design.Icon size={80} />
                        </div>
                        <span className="text-xs text-white/40">Android</span>
                      </div>

                      {/* macOS Style */}
                      <div className="flex flex-col items-center gap-3">
                        <div
                          className="overflow-hidden"
                          style={{
                            borderRadius: '22.5%',
                            boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
                          }}
                        >
                          <design.Icon size={96} />
                        </div>
                        <span className="text-xs text-white/40">macOS</span>
                      </div>

                      {/* Favicon */}
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2">
                          <design.Icon size={16} />
                          <span className="text-sm text-white/60">marked.app</span>
                        </div>
                        <span className="text-xs text-white/40">Browser Tab</span>
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
      <footer className="border-t border-white/10 px-8 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between">
            <p className="text-sm text-white/30">Marked Branding — Icon Concepts</p>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded" style={{ backgroundColor: BRAND_COLOR }} />
              <span className="text-xs text-white/50">#059669</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
