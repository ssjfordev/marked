'use client';

import { useState, useMemo } from 'react';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useLocale } from '@/components/LanguageProvider';

interface ExportGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type BrowserTab = 'chrome' | 'firefox' | 'safari' | 'edge' | 'raindrop' | 'csv';

const TABS: { id: BrowserTab; label: string }[] = [
  { id: 'chrome', label: 'Chrome' },
  { id: 'firefox', label: 'Firefox' },
  { id: 'safari', label: 'Safari' },
  { id: 'edge', label: 'Edge' },
  { id: 'raindrop', label: 'Raindrop' },
  { id: 'csv', label: 'CSV' },
];

export function ExportGuideModal({ isOpen, onClose }: ExportGuideModalProps) {
  const { t } = useLocale();
  const [activeTab, setActiveTab] = useState<BrowserTab>('chrome');

  const GUIDES: Record<BrowserTab, { title: string; steps: string[] }> = useMemo(
    () => ({
      chrome: {
        title: t('exportGuide.chrome.title'),
        steps: [
          t('exportGuide.chrome.step1'),
          t('exportGuide.chrome.step2'),
          t('exportGuide.chrome.step3'),
          t('exportGuide.chrome.step4'),
        ],
      },
      firefox: {
        title: t('exportGuide.firefox.title'),
        steps: [
          t('exportGuide.firefox.step1'),
          t('exportGuide.firefox.step2'),
          t('exportGuide.firefox.step3'),
          t('exportGuide.firefox.step4'),
        ],
      },
      safari: {
        title: t('exportGuide.safari.title'),
        steps: [
          t('exportGuide.safari.step1'),
          t('exportGuide.safari.step2'),
          t('exportGuide.safari.step3'),
          t('exportGuide.safari.step4'),
        ],
      },
      edge: {
        title: t('exportGuide.edge.title'),
        steps: [
          t('exportGuide.edge.step1'),
          t('exportGuide.edge.step2'),
          t('exportGuide.edge.step3'),
          t('exportGuide.edge.step4'),
        ],
      },
      raindrop: {
        title: t('exportGuide.raindrop.title'),
        steps: [
          t('exportGuide.raindrop.step1'),
          t('exportGuide.raindrop.step2'),
          t('exportGuide.raindrop.step3'),
          t('exportGuide.raindrop.step4'),
          t('exportGuide.raindrop.step5'),
        ],
      },
      csv: {
        title: t('exportGuide.csv.title'),
        steps: [
          t('exportGuide.csv.step1'),
          t('exportGuide.csv.step2'),
          t('exportGuide.csv.step3'),
          t('exportGuide.csv.step4'),
        ],
      },
    }),
    [t]
  );

  const guide = GUIDES[activeTab];

  const handleDownloadTemplate = () => {
    window.open('/templates/bookmarks-template.csv', '_blank');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('exportGuide.title')} size="lg">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1 mb-5 pb-4 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              px-3 py-1.5 text-xs font-medium rounded-md transition-colors
              ${
                activeTab === tab.id
                  ? 'bg-primary text-white'
                  : 'bg-surface-hover text-foreground-secondary hover:text-foreground'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Guide Content */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-4">{guide.title}</h3>
        <ol className="space-y-3">
          {guide.steps.map((step, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary-light text-xs font-medium flex items-center justify-center">
                {index + 1}
              </span>
              <span className="text-sm text-foreground-secondary pt-0.5">{step}</span>
            </li>
          ))}
        </ol>

        {/* CSV Template Download Button */}
        {activeTab === 'csv' && (
          <div className="mt-5 pt-4 border-t border-border">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownloadTemplate}
              icon={
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
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
              }
            >
              {t('exportGuide.csvTemplate')}
            </Button>
            <p className="text-xs text-foreground-muted mt-2">{t('exportGuide.csvColumns')}</p>
          </div>
        )}
      </div>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          {t('common.close')}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
