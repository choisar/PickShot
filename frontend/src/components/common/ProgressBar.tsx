import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 to 100
  label?: string;
  subLabel?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, label, subLabel }) => {
  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <div style={{ width: '100%' }}>
      {(label || subLabel) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px',
            fontSize: '0.875rem',
          }}
        >
          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{label}</span>
          <span style={{ color: 'var(--text-secondary)' }}>{subLabel || `${clamped}%`}</span>
        </div>
      )}
      <div
        style={{
          width: '100%',
          height: '8px',
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '999px',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: `${clamped}%`,
            height: '100%',
            background: 'var(--accent-gradient)',
            borderRadius: '999px',
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 0 12px rgba(99, 102, 241, 0.5)',
          }}
        />
      </div>
    </div>
  );
};
