import React from 'react';
import { Button } from './Button';

interface ConsentDialogProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export const ConsentDialog: React.FC<ConsentDialogProps> = ({ isOpen, onAccept, onDecline }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--bg-overlay)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
      }}
    >
      <div
        className="glass-panel"
        style={{
          maxWidth: '540px',
          width: '100%',
          padding: '32px',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-glow)',
        }}
      >
        <h2 style={{ fontSize: '1.5rem', marginBottom: '16px' }} className="gradient-text">
          데이터 활용 및 개인정보 보호 안내
        </h2>

        <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '24px' }}>
          <p style={{ marginBottom: '12px' }}>
            PickShot은 <strong>Zero-Egress 원칙</strong>을 준수합니다.
          </p>
          <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
            <li>사용자의 <strong>고화질 원본 사진은 절대 서버로 전송되지 않으며</strong>, 브라우저 내부에서만 처리됩니다.</li>
            <li>서비스 품질 개선 및 AI 연구 목적으로 <strong>1080px 비식별화 썸네일</strong>과 사용자 선택(Pairwise) 데이터만 수집됩니다.</li>
            <li>File System API를 통해 최종 선별된 원본만 사용자 PC에 안전하게 저장됩니다.</li>
          </ul>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onDecline}>
            취소
          </Button>
          <Button variant="primary" onClick={onAccept}>
            동의하고 시작하기
          </Button>
        </div>
      </div>
    </div>
  );
};
