'use client';

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ToastProps {
  message: string;
  action?: { label: string; onClick: () => void };
  duration?: number;
  onDismiss: () => void;
}

export function Toast({ message, action, duration = 5000, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(100);
  const [mounted, setMounted] = useState(false);
  const startTimeRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Slide in
  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // Progress bar + auto-dismiss
  useEffect(() => {
    startTimeRef.current = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);

    timeoutRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 200);
    }, duration);

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(timeoutRef.current);
    };
  }, [duration, onDismiss]);

  const handleAction = () => {
    cancelAnimationFrame(rafRef.current);
    clearTimeout(timeoutRef.current);
    action?.onClick();
    setVisible(false);
    setTimeout(onDismiss, 200);
  };

  if (!mounted) return null;

  return createPortal(
    <div
      className={`
        fixed bottom-6 left-1/2 -translate-x-1/2 z-50
        transition-all duration-200 ease-out
        ${visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
      `
        .trim()
        .replace(/\s+/g, ' ')}
    >
      <div className="relative overflow-hidden rounded-lg bg-neutral-900 text-neutral-100 shadow-lg px-4 py-3 min-w-[280px] max-w-[420px]">
        <div className="flex items-center gap-3">
          <span className="text-sm">{message}</span>
          {action && (
            <button
              onClick={handleAction}
              className="text-sm font-semibold underline underline-offset-2 hover:text-white whitespace-nowrap ml-auto"
            >
              {action.label}
            </button>
          )}
        </div>
        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-700">
          <div
            className="h-full bg-neutral-400 transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
