import React from 'react';
import { useCurationStore } from '../../stores/curationStore';
import { ProgressBar } from '../common/ProgressBar';

export const UploadProgress: React.FC = () => {
  const { progress } = useCurationStore();

  return (
    <div
      className="glass-panel"
      style={{
        padding: '32px',
        maxWidth: '600px',
        margin: '40px auto',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          margin: '0 auto 16px',
          borderRadius: '50%',
          border: '3px solid rgba(99, 102, 241, 0.2)',
          borderTopColor: 'var(--accent-primary)',
          animation: 'spin 1s linear infinite',
        }}
      />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>
        {progress.stage === 'reading' && '대용량 파일 청크 로딩 중'}
        {progress.stage === 'exif' && 'EXIF 타임스탬프 분석 중'}
        {progress.stage === 'thumbnail' && '1080px 썸네일 안전 생성 중'}
        {progress.stage === 'clustering' && '연사 그룹 클러스터링 중'}
        {progress.stage === 'ai_evaluating' && 'AI 베스트 샷 선별 중'}
      </h3>

      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
        {progress.statusMessage}
      </p>

      <ProgressBar
        progress={progress.percentage}
        label={`${progress.processedFiles} / ${progress.totalFiles} 파일 처리됨`}
      />
    </div>
  );
};
