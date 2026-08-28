import React, { useState, useEffect } from 'react';
import { ImageMetadata, ImageScore } from '../../types/image';
import { AiRecommendBadge } from './BestPickBadge';

interface ImageCardProps {
  groupId: string;
  image: ImageMetadata;
  isAiRecommended?: boolean;
  isSelected?: boolean;
  score?: ImageScore;
  onToggleSelect: (imageId: string) => void;
  onOpenCompare: (imageId: string) => void;
}

export const ImageCard: React.FC<ImageCardProps> = ({
  groupId,
  image,
  isAiRecommended,
  isSelected,
  score,
  onToggleSelect,
  onOpenCompare,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (image.thumbnailUrl) {
      setPreviewUrl(image.thumbnailUrl);
    } else if (image.file) {
      const url = URL.createObjectURL(image.file);
      setPreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [image]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({ groupId, imageId: image.id })
    );
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={() => onOpenCompare(image.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        border: isSelected
          ? '2.5px solid #10b981'
          : isAiRecommended
          ? '2px solid rgba(99, 102, 241, 0.7)'
          : '1px solid rgba(255, 255, 255, 0.12)',
        background: 'var(--bg-secondary)',
        aspectRatio: '4/3',
        boxShadow: isSelected
          ? '0 0 16px rgba(16, 185, 129, 0.4)'
          : isAiRecommended
          ? '0 0 12px rgba(99, 102, 241, 0.25)'
          : 'none',
        transition: 'all var(--transition-normal)',
        cursor: 'grab',
        userSelect: 'none',
      }}
    >
      {/* Permanent AI Recommended Badge */}
      {isAiRecommended && <AiRecommendBadge />}

      {/* Top-Right Checkbox for Best Cut Selection */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelect(image.id);
        }}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 15,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '26px',
          height: '26px',
          borderRadius: '6px',
          background: isSelected
            ? '#10b981'
            : 'rgba(0, 0, 0, 0.6)',
          border: isSelected
            ? '2px solid #10b981'
            : '2px solid rgba(255, 255, 255, 0.5)',
          color: '#ffffff',
          fontWeight: 'bold',
          fontSize: '0.9rem',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
          transition: 'all 0.15s ease',
        }}
        title={isSelected ? '베스트 컷 선택 해제' : '베스트 컷으로 선택'}
      >
        {isSelected && '✓'}
      </div>

      {previewUrl ? (
        <img
          src={previewUrl}
          alt={image.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: isHovered ? 'scale(1.03)' : 'scale(1)',
            transition: 'transform 0.25s ease',
          }}
          loading="lazy"
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
          }}
        >
          로딩 중...
        </div>
      )}

      {/* Overlay action controls on hover */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(0, 0, 0, 0.88) 0%, rgba(0, 0, 0, 0.2) 60%, transparent 100%)',
          opacity: isHovered ? 1 : 0,
          transition: 'opacity var(--transition-fast)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '10px',
          gap: '6px',
        }}
      >
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(image.id);
            }}
            style={{
              flex: 1,
              padding: '6px 8px',
              borderRadius: 'var(--radius-sm)',
              background: isSelected ? '#10b981' : 'rgba(255, 255, 255, 0.15)',
              border: isSelected ? 'none' : '1px solid rgba(255, 255, 255, 0.3)',
              color: '#fff',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
            }}
          >
            <span>{isSelected ? '✓' : '☐'}</span>
            <span>{isSelected ? '선택됨' : '베스트 선택'}</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenCompare(image.id);
            }}
            style={{
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(4px)',
              color: '#fff',
              fontSize: '0.75rem',
              cursor: 'pointer',
              border: 'none',
            }}
          >
            🔍 확대
          </button>
        </div>

        {score && (
          <div style={{ fontSize: '0.72rem', color: '#e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
            <span>AI 총점: {Math.round((score.totalScore || 0) * 100)}점</span>
            <span style={{ color: '#94a3b8' }}>선명 {Math.round((score.sharpnessScore || 0) * 100)}</span>
          </div>
        )}
      </div>
    </div>
  );
};
