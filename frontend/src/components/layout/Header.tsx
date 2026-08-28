import React from 'react';
import { useCurationStore } from '../../stores/curationStore';
import { Button } from '../common/Button';

export const Header: React.FC = () => {
  const { currentStep, resetState } = useCurationStore();

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        height: '70px',
        borderBottom: '1px solid var(--border-color)',
        background: 'rgba(11, 15, 25, 0.8)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'var(--accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '1.2rem',
            color: '#fff',
            boxShadow: 'var(--shadow-glow)',
          }}
        >
          P
        </div>
        <div>
          <h1 style={{ fontSize: '1.25rem', letterSpacing: '-0.03em' }}>
            <span className="gradient-text">Pick</span>Shot
          </h1>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {currentStep !== 'upload' && (
          <Button variant="ghost" size="sm" onClick={resetState}>
            새로 시작
          </Button>
        )}
        <span
          style={{
            fontSize: '0.8rem',
            padding: '4px 10px',
            borderRadius: '999px',
            background: 'rgba(16, 185, 129, 0.15)',
            color: 'var(--success)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            fontWeight: 600,
          }}
        >
          Zero-Egress 보안
        </span>
      </div>
    </header>
  );
};
