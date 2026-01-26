'use client';

import { useState } from 'react';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

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

const GUIDES: Record<BrowserTab, { title: string; steps: string[] }> = {
  chrome: {
    title: 'Chrome에서 북마크 내보내기',
    steps: [
      'Chrome을 열고 주소창에 chrome://bookmarks 입력',
      '오른쪽 상단 ⋮ (더보기) 버튼 클릭',
      '"북마크 내보내기" 선택',
      'HTML 파일로 저장 후 여기에 업로드',
    ],
  },
  firefox: {
    title: 'Firefox에서 북마크 내보내기',
    steps: [
      'Firefox를 열고 Ctrl+Shift+O (Mac: Cmd+Shift+O) 눌러 북마크 관리자 열기',
      '상단 메뉴에서 "가져오기 및 백업" 클릭',
      '"HTML로 북마크 내보내기..." 선택',
      'HTML 파일로 저장 후 여기에 업로드',
    ],
  },
  safari: {
    title: 'Safari에서 북마크 내보내기',
    steps: [
      'Safari를 열고 상단 메뉴에서 "파일" 클릭',
      '"북마크 내보내기..." 선택',
      '저장 위치를 선택하고 HTML 파일로 저장',
      '저장된 파일을 여기에 업로드',
    ],
  },
  edge: {
    title: 'Microsoft Edge에서 북마크 내보내기',
    steps: [
      'Edge를 열고 주소창에 edge://favorites 입력',
      '오른쪽 상단 ⋯ (더보기) 버튼 클릭',
      '"즐겨찾기 내보내기" 선택',
      'HTML 파일로 저장 후 여기에 업로드',
    ],
  },
  raindrop: {
    title: 'Raindrop.io에서 북마크 내보내기',
    steps: [
      'Raindrop.io 웹사이트에 로그인',
      '설정 (Settings) → 백업 (Backups) 이동',
      '"Export" 버튼 클릭',
      'HTML 또는 CSV 형식 선택 후 다운로드',
      '다운로드된 파일을 여기에 업로드',
    ],
  },
  csv: {
    title: 'CSV 파일로 가져오기',
    steps: [
      '아래 템플릿 다운로드 버튼 클릭',
      '스프레드시트 프로그램(Excel, Google Sheets 등)으로 열기',
      '북마크 정보 입력 (URL은 필수, 나머지는 선택)',
      'CSV 형식으로 저장 후 여기에 업로드',
    ],
  },
};

export function ExportGuideModal({ isOpen, onClose }: ExportGuideModalProps) {
  const [activeTab, setActiveTab] = useState<BrowserTab>('chrome');

  const guide = GUIDES[activeTab];

  const handleDownloadTemplate = () => {
    window.open('/templates/bookmarks-template.csv', '_blank');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="북마크 내보내기 가이드" size="lg">
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
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              }
            >
              CSV 템플릿 다운로드
            </Button>
            <p className="text-xs text-foreground-muted mt-2">
              컬럼: url (필수), title, description, folder (슬래시로 계층 구분), tags (파이프로 구분)
            </p>
          </div>
        )}
      </div>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          닫기
        </Button>
      </ModalFooter>
    </Modal>
  );
}
