import React, { useRef, useState } from 'react';
import { Button } from '../common/Button';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFilesSelected, disabled }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const validFiles = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith('image/')
      );
      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const validFiles = Array.from(e.target.files).filter((file) =>
        file.type.startsWith('image/')
      );
      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !disabled && fileInputRef.current?.click()}
      className="glass-panel"
      style={{
        border: `2px dashed ${isDragOver ? 'var(--accent-primary)' : 'var(--border-color)'}`,
        borderRadius: 'var(--radius-xl)',
        padding: '64px 32px',
        textAlign: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all var(--transition-normal)',
        backgroundColor: isDragOver ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-card)',
        transform: isDragOver ? 'scale(1.01)' : 'scale(1)',
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileInput}
        disabled={disabled}
      />

      <div
        style={{
          width: '72px',
          height: '72px',
          margin: '0 auto 20px',
          borderRadius: '50%',
          background: 'rgba(99, 102, 241, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--accent-primary)',
          fontSize: '2rem',
        }}
      >
        📸
      </div>

      <h3 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>
        연사/사진 파일들을 이곳에 드래그하세요
      </h3>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '1rem' }}>
        수백~수천 장의 대용량 이미지도 메모리 문제 없이 즉시 클러스터링 및 선별합니다.
      </p>

      <Button
        variant="primary"
        size="lg"
        onClick={(e) => {
          e.stopPropagation();
          fileInputRef.current?.click();
        }}
      >
        내 컴퓨터에서 사진 선택
      </Button>
    </div>
  );
};
