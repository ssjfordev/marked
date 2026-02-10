'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useLocale } from './LanguageProvider';

interface UserMenuProps {
  email: string;
  plan: 'free' | 'pro' | 'ai_pro';
  status: string;
  onSignOut: () => void;
}

export function UserMenu({ email, plan, status, onSignOut }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { t } = useLocale();

  const planLabels = {
    free: t('plan.free'),
    pro: t('plan.pro'),
    ai_pro: t('plan.aiPro'),
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Get initials from email
  const initials = email.split('@')[0]?.slice(0, 2).toUpperCase() || '??';

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-center
          w-9 h-9 rounded-lg
          bg-primary/10 text-primary-light
          text-xs font-semibold
          transition-all duration-150
          hover:bg-primary/20
          focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50
          cursor-pointer
          ${isOpen ? 'ring-2 ring-primary/30' : ''}
        `
          .trim()
          .replace(/\s+/g, ' ')}
      >
        {initials}
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className="
            absolute right-0 top-full mt-2 z-50
            w-64 py-2
            bg-bg-elevated border border-border rounded-xl
            shadow-lg
            animate-slideDown
          "
        >
          {/* User Info */}
          <div className="px-4 py-3 border-b border-border">
            <div className="text-sm font-medium text-foreground truncate">{email}</div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs text-primary-light font-medium">{planLabels[plan]}</span>
              <span className="text-foreground-faint">·</span>
              <span className="text-xs text-foreground-muted capitalize">{status}</span>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1.5">
            <Link
              href="/settings/billing"
              onClick={() => setIsOpen(false)}
              className="
                flex items-center gap-3 px-4 py-2.5
                text-sm text-foreground-secondary
                hover:text-foreground hover:bg-hover
                transition-colors duration-150
                cursor-pointer
              "
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {t('userMenu.settings')}
            </Link>

            {plan === 'free' && (
              <Link
                href="/settings/billing"
                onClick={() => setIsOpen(false)}
                className="
                  flex items-center gap-3 px-4 py-2.5
                  text-sm text-primary-light
                  hover:bg-primary/5
                  transition-colors duration-150
                  cursor-pointer
                "
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                {t('userMenu.upgradeToPro')}
              </Link>
            )}
          </div>

          {/* Sign Out */}
          <div className="pt-1.5 border-t border-border">
            <button
              onClick={() => {
                setIsOpen(false);
                onSignOut();
              }}
              className="
                flex items-center gap-3 w-full px-4 py-2.5
                text-sm text-foreground-muted
                hover:text-foreground hover:bg-hover
                transition-colors duration-150
                cursor-pointer
              "
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              {t('userMenu.signOut')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
