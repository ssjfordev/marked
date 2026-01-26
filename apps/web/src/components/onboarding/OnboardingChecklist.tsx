'use client';

import { useState } from 'react';
import Link from 'next/link';
import { trackOnboardingStep } from '@/lib/analytics/gtag';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  href?: string;
  action?: string;
}

interface OnboardingChecklistProps {
  hasExtension: boolean;
  hasImported: boolean;
  hasFirstMark: boolean;
  hasFirstSearch: boolean;
}

export function OnboardingChecklist({
  hasExtension,
  hasImported,
  hasFirstMark,
  hasFirstSearch,
}: OnboardingChecklistProps) {
  const [dismissed, setDismissed] = useState(false);

  const steps: OnboardingStep[] = [
    {
      id: 'extension',
      title: 'Install Chrome Extension',
      description: 'Save links and create marks from any page',
      completed: hasExtension,
      href: '/extension',
      action: 'Install',
    },
    {
      id: 'import',
      title: 'Import Bookmarks',
      description: 'Bring your existing bookmarks into Marked',
      completed: hasImported,
      href: '/import',
      action: 'Import',
    },
    {
      id: 'mark',
      title: 'Create Your First Mark',
      description: 'Highlight important text on any page',
      completed: hasFirstMark,
    },
    {
      id: 'search',
      title: 'Try Search',
      description: 'Find links across all your folders',
      completed: hasFirstSearch,
      href: '/search',
      action: 'Search',
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const allCompleted = completedCount === steps.length;

  // Auto-dismiss when all completed (on mount only)
  const initiallyCompleted = allCompleted;
  const [autoDismissed] = useState(initiallyCompleted);

  // Track step clicks
  const handleStepClick = (stepId: string) => {
    trackOnboardingStep(stepId);
  };

  if (dismissed || autoDismissed || allCompleted) {
    return null;
  }

  return (
    <div className="mb-6 rounded-xl border border-[#059669]/20 bg-[#059669]/5 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#059669]/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-white">Getting Started</h3>
            <p className="text-xs text-white/50">
              {completedCount} of {steps.length} completed
            </p>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="w-6 h-6 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-colors"
          title="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-3 h-1 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full bg-[#10B981] transition-all duration-300"
          style={{ width: `${(completedCount / steps.length) * 100}%` }}
        />
      </div>

      {/* Steps - compact horizontal layout */}
      <div className="grid grid-cols-2 gap-2">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`
              flex items-center gap-2 rounded-lg px-3 py-2
              ${step.completed ? 'bg-white/[0.03]' : 'bg-white/[0.05]'}
            `}
          >
            {/* Checkbox */}
            <div
              className={`
                flex w-4 h-4 flex-shrink-0 items-center justify-center rounded-full
                ${step.completed
                  ? 'bg-[#10B981] text-white'
                  : 'border border-white/20'
                }
              `}
            >
              {step.completed && (
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className={`text-xs font-medium truncate ${step.completed ? 'text-white/40' : 'text-white/80'}`}>
                {step.title}
              </div>
            </div>

            {/* Action */}
            {!step.completed && step.href && (
              <Link
                href={step.href}
                onClick={() => handleStepClick(step.id)}
                className="text-[10px] font-medium text-[#10B981] hover:text-[#059669] transition-colors flex-shrink-0"
              >
                {step.action} →
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
