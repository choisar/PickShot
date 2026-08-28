import React from 'react';

export const AiRecommendBadge: React.FC = () => {
  return (
    <div
      style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        color: '#ffffff',
        padding: '3px 8px',
        borderRadius: '8px',
        fontSize: '0.72rem',
        fontWeight: 700,
        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.5)',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        zIndex: 10,
        letterSpacing: '0.02em',
        border: '1px solid rgba(255, 255, 255, 0.3)',
      }}
    >
      <span>✨</span>
      <span>AI 추천</span>
    </div>
  );
};

export const BestPickBadge: React.FC = () => {
  return (
    <div
      style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        color: '#ffffff',
        padding: '3px 8px',
        borderRadius: '8px',
        fontSize: '0.72rem',
        fontWeight: 700,
        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.5)',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        zIndex: 10,
        letterSpacing: '0.02em',
        border: '1px solid rgba(255, 255, 255, 0.3)',
      }}
    >
      <span>✓</span>
      <span>베스트 선택</span>
    </div>
  );
};
