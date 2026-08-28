import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ImageGroup } from '../../types/image';
import { useZoomTracker } from '../../hooks/useZoomTracker';
import { Button } from '../common/Button';

interface CompareModalProps {
  isOpen: boolean;
  group: ImageGroup | null;
  selectedImageId?: string;
  onClose: () => void;
  onSelectBest: (imageId: string) => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  isOpen,
  group,
  selectedImageId,
  onClose,
  onSelectBest,
}) => {
  const [currentId, setCurrentId] = useState<string>('');
  const [zoomScale, setZoomScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);

  const panRef = useRef({ x: 0, y: 0 });
  const zoomScaleRef = useRef(1);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const transformTargetRef = useRef<HTMLDivElement>(null);
  const thumbnailStripRef = useRef<HTMLDivElement>(null);

  const { trackZoomInteraction } = useZoomTracker();

  // Pre-generate and memoize blob URLs to avoid creating thousands of URLs on every render
  const imageUrlMap = useMemo(() => {
    if (!group) return {};
    const map: Record<string, string> = {};
    group.images.forEach((img) => {
      if (img.thumbnailUrl) {
        map[img.id] = img.thumbnailUrl;
      } else if (img.file) {
        map[img.id] = URL.createObjectURL(img.file);
      }
    });
    return map;
  }, [group]);

  // Clean up blob URLs when group unmounts
  useEffect(() => {
    return () => {
      Object.values(imageUrlMap).forEach((url) => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [imageUrlMap]);

  // Sync zoomScaleRef
  zoomScaleRef.current = zoomScale;

  // Apply GPU-accelerated 3D transform directly to the DOM node for 120 FPS performance
  const updateTransformDOM = useCallback((x: number, y: number, scale: number, animated = false) => {
    if (!transformTargetRef.current) return;
    transformTargetRef.current.style.transition = animated ? 'transform 0.15s cubic-bezier(0.2, 0, 0, 1)' : 'none';
    transformTargetRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
  }, []);

  // Sync selected image when modal opens or selectedImageId changes
  useEffect(() => {
    if (selectedImageId) {
      setCurrentId(selectedImageId);
    } else if (group && group.images.length > 0) {
      setCurrentId(group.images[0].id);
    }
    // Reset zoom & pan on open or change
    setZoomScale(1);
    panRef.current = { x: 0, y: 0 };
    updateTransformDOM(0, 0, 1, false);
  }, [selectedImageId, group, isOpen, updateTransformDOM]);

  const images = group?.images || [];
  const currentIndex = images.findIndex((img) => img.id === currentId);
  const currentImage = currentIndex !== -1 ? images[currentIndex] : images[0] || null;

  // Navigation handlers
  const handlePrev = useCallback(() => {
    if (images.length <= 1) return;
    const newIndex = (currentIndex - 1 + images.length) % images.length;
    setCurrentId(images[newIndex].id);
    setZoomScale(1);
    panRef.current = { x: 0, y: 0 };
    updateTransformDOM(0, 0, 1, false);
  }, [currentIndex, images, updateTransformDOM]);

  const handleNext = useCallback(() => {
    if (images.length <= 1) return;
    const newIndex = (currentIndex + 1) % images.length;
    setCurrentId(images[newIndex].id);
    setZoomScale(1);
    panRef.current = { x: 0, y: 0 };
    updateTransformDOM(0, 0, 1, false);
  }, [currentIndex, images, updateTransformDOM]);

  const handleSelectImage = (id: string) => {
    setCurrentId(id);
    setZoomScale(1);
    panRef.current = { x: 0, y: 0 };
    updateTransformDOM(0, 0, 1, false);
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === ' ') {
        e.preventDefault();
        if (currentImage) onSelectBest(currentImage.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handlePrev, handleNext, onClose, onSelectBest, currentImage]);

  // Non-passive native wheel listener for ultra-fast GPU wheel zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isOpen) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const currentScale = zoomScaleRef.current;
      const zoomFactor = e.deltaY < 0 ? 1.2 : 0.833;
      const newScale = Math.min(Math.max(currentScale * zoomFactor, 1), 8);

      if (newScale === 1) {
        panRef.current = { x: 0, y: 0 };
      } else {
        const rect = container.getBoundingClientRect();
        const cursorX = e.clientX - rect.left - rect.width / 2;
        const cursorY = e.clientY - rect.top - rect.height / 2;
        const scaleRatio = newScale / currentScale;

        panRef.current = {
          x: cursorX - (cursorX - panRef.current.x) * scaleRatio,
          y: cursorY - (cursorY - panRef.current.y) * scaleRatio,
        };

        if (currentImage && newScale > 1) {
          const normX = ((e.clientX - rect.left) / rect.width) * 100;
          const normY = ((e.clientY - rect.top) / rect.height) * 100;
          trackZoomInteraction(currentImage.id, normX, normY, newScale);
        }
      }

      updateTransformDOM(panRef.current.x, panRef.current.y, newScale, false);
      setZoomScale(newScale);
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', onWheel);
    };
  }, [isOpen, currentImage, trackZoomInteraction, updateTransformDOM]);

  // High-performance requestAnimationFrame based Mouse Drag & Pan
  useEffect(() => {
    if (!isOpen) return;

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;

      const newX = e.clientX - dragStartRef.current.x;
      const newY = e.clientY - dragStartRef.current.y;
      panRef.current = { x: newX, y: newY };

      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = requestAnimationFrame(() => {
        updateTransformDOM(newX, newY, zoomScaleRef.current, false);
      });
    };

    const onMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsDragging(false);
      }
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mouseup', onMouseUp, { passive: true });

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [isOpen, updateTransformDOM]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (zoomScale <= 1) return;
    isDraggingRef.current = true;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - panRef.current.x,
      y: e.clientY - panRef.current.y,
    };
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (zoomScale > 1) {
      setZoomScale(1);
      panRef.current = { x: 0, y: 0 };
      updateTransformDOM(0, 0, 1, true);
    } else if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const cursorX = e.clientX - rect.left - rect.width / 2;
      const cursorY = e.clientY - rect.top - rect.height / 2;
      const newScale = 2.5;

      panRef.current = {
        x: -cursorX * 1.5,
        y: -cursorY * 1.5,
      };

      updateTransformDOM(panRef.current.x, panRef.current.y, newScale, true);
      setZoomScale(newScale);

      if (currentImage) {
        const normX = ((e.clientX - rect.left) / rect.width) * 100;
        const normY = ((e.clientY - rect.top) / rect.height) * 100;
        trackZoomInteraction(currentImage.id, normX, normY, newScale);
      }
    }
  };

  const resetZoom = () => {
    setZoomScale(1);
    panRef.current = { x: 0, y: 0 };
    updateTransformDOM(0, 0, 1, true);
  };

  const setFixedZoom = (scale: number) => {
    setZoomScale(scale);
    if (scale === 1) {
      panRef.current = { x: 0, y: 0 };
    }
    updateTransformDOM(panRef.current.x, panRef.current.y, scale, true);
  };

  if (!isOpen || !group || !currentImage) return null;

  const bestIds = group.bestImageIds || (group.bestImageId ? [group.bestImageId] : []);
  const isAiRecommended = group.aiSuggestedBestId === currentImage.id;
  const isSelected = bestIds.includes(currentImage.id);
  const currentScore = group.scores?.[currentImage.id];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 7, 15, 0.95)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        padding: '20px 24px',
        userSelect: 'none',
      }}
    >
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#f3f4f6' }}>
                {group.name}
              </h2>
              <span
                style={{
                  background: 'rgba(99, 102, 241, 0.25)',
                  color: 'var(--accent-primary)',
                  padding: '2px 10px',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                {currentIndex + 1} / {images.length}
              </span>
              {isAiRecommended && (
                <span
                  style={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    color: '#ffffff',
                    padding: '2px 10px',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                  }}
                >
                  ✨ AI 추천
                </span>
              )}
              {isSelected && (
                <span
                  style={{
                    background: 'rgba(16, 185, 129, 0.25)',
                    color: 'var(--success)',
                    padding: '2px 10px',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                  }}
                >
                  ✓ 베스트 선택됨
                </span>
              )}
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px' }}>
              {currentImage.name} • [← / →] 사진 전환 • [Space] 베스트 지정 • [마우스 휠] 줌 • [드래그] 이동 • [더블클릭] 2.5x 확대 • [ESC] 닫기
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {currentScore && (
            <div
              style={{
                fontSize: '0.85rem',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--border-color)',
                color: '#d1d5db',
              }}
            >
              AI 총점: <strong style={{ color: '#fff' }}>{Math.round((currentScore.totalScore || 0) * 100)}점</strong>
              {' '}(선명도 {Math.round((currentScore.sharpnessScore || 0) * 100)}점 / 심미성 {Math.round((currentScore.preferenceScore || 0) * 100)}점)
            </div>
          )}

          <Button
            variant={isSelected ? 'secondary' : 'primary'}
            onClick={() => onSelectBest(currentImage.id)}
          >
            {isSelected ? '✓ 베스트 선택됨 (해제)' : '⭐ 베스트 컷으로 선택'}
          </Button>

          <Button variant="outline" onClick={onClose}>
            닫기 (ESC)
          </Button>
        </div>
      </div>

      {/* Main Image View Area */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          backgroundColor: '#020307',
          borderRadius: 'var(--radius-lg)',
          position: 'relative',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          cursor: zoomScale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
        }}
      >
        {/* Previous Button */}
        {images.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            aria-label="이전 사진"
            style={{
              position: 'absolute',
              left: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 20,
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: '#fff',
              fontSize: '1.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.6)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(99, 102, 241, 0.9)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(15, 23, 42, 0.85)')}
          >
            ‹
          </button>
        )}

        {/* Next Button */}
        {images.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            aria-label="다음 사진"
            style={{
              position: 'absolute',
              right: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 20,
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: '#fff',
              fontSize: '1.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.6)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(99, 102, 241, 0.9)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(15, 23, 42, 0.85)')}
          >
            ›
          </button>
        )}

        {/* Hardware-Accelerated Render Container with Pan & Zoom */}
        <div
          ref={transformTargetRef}
          style={{
            transform: `translate3d(${panRef.current.x}px, ${panRef.current.y}px, 0) scale(${zoomScale})`,
            transformOrigin: 'center center',
            willChange: 'transform',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          <img
            src={imageUrlMap[currentImage.id] || ''}
            alt={currentImage.name}
            style={{
              maxWidth: '92%',
              maxHeight: '92%',
              objectFit: 'contain',
              borderRadius: '4px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
              userSelect: 'none',
              pointerEvents: 'none',
            }}
            draggable={false}
          />
        </div>

        {/* Floating Zoom Controls Toolbar */}
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(15, 23, 42, 0.92)',
            padding: '6px 16px',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            zIndex: 30,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
          }}
        >
          <button
            onClick={() => setFixedZoom(Math.max(zoomScale / 1.3, 1))}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              padding: '4px 8px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
            }}
            title="축소"
          >
            −
          </button>

          <span style={{ fontSize: '0.85rem', color: '#e2e8f0', minWidth: '45px', textAlign: 'center' }}>
            {Math.round(zoomScale * 100)}%
          </span>

          <button
            onClick={() => setFixedZoom(Math.min(zoomScale * 1.3, 8))}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              padding: '4px 8px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
            }}
            title="확대"
          >
            +
          </button>

          <div style={{ width: '1px', height: '16px', background: 'rgba(255, 255, 255, 0.2)', margin: '0 4px' }} />

          <button
            onClick={resetZoom}
            style={{
              background: zoomScale === 1 ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
              border: 'none',
              color: zoomScale === 1 ? '#94a3b8' : '#38bdf8',
              cursor: 'pointer',
              padding: '2px 10px',
              fontSize: '0.8rem',
              borderRadius: '12px',
              fontWeight: 500,
            }}
          >
            100% 리셋
          </button>

          <button
            onClick={() => setFixedZoom(2.5)}
            style={{
              background: zoomScale === 2.5 ? 'rgba(99, 102, 241, 0.4)' : 'transparent',
              border: 'none',
              color: '#e2e8f0',
              cursor: 'pointer',
              padding: '2px 10px',
              fontSize: '0.8rem',
              borderRadius: '12px',
              fontWeight: 500,
            }}
          >
            2.5x 줌
          </button>
        </div>
      </div>

      {/* Bottom Thumbnail Strip */}
      <div
        ref={thumbnailStripRef}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          overflowX: 'auto',
          paddingTop: '14px',
          paddingBottom: '4px',
          justifyContent: images.length < 8 ? 'center' : 'flex-start',
        }}
      >
        {images.map((img, idx) => {
          const isCurrentActive = img.id === currentImage.id;
          const isImgAi = group.aiSuggestedBestId === img.id;
          const isImgSelected = bestIds.includes(img.id);

          return (
            <button
              key={img.id}
              onClick={() => handleSelectImage(img.id)}
              style={{
                position: 'relative',
                width: '88px',
                height: '66px',
                flexShrink: 0,
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                border: isCurrentActive
                  ? '2.5px solid var(--accent-primary)'
                  : isImgSelected
                  ? '2px solid #10b981'
                  : '1px solid rgba(255, 255, 255, 0.15)',
                opacity: isCurrentActive ? 1 : 0.65,
                transform: isCurrentActive ? 'scale(1.05)' : 'scale(1)',
                transition: 'all 0.15s ease',
                cursor: 'pointer',
                background: '#1e293b',
                padding: 0,
              }}
            >
              <img
                src={imageUrlMap[img.id] || ''}
                alt={img.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />

              {/* Number indicator */}
              <div
                style={{
                  position: 'absolute',
                  top: '2px',
                  left: '2px',
                  background: 'rgba(0, 0, 0, 0.75)',
                  color: '#fff',
                  fontSize: '0.7rem',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  fontWeight: 600,
                }}
              >
                #{idx + 1}
              </div>

              {/* AI Recommend indicator */}
              {isImgAi && (
                <div
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    color: '#fff',
                    fontSize: '0.6rem',
                    padding: '1px 4px',
                    borderRadius: '2px',
                    fontWeight: 'bold',
                  }}
                >
                  AI
                </div>
              )}

              {/* User Selection indicator */}
              {isImgSelected && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '2px',
                    right: '2px',
                    background: '#10b981',
                    color: '#fff',
                    fontSize: '0.65rem',
                    padding: '1px 4px',
                    borderRadius: '2px',
                    fontWeight: 'bold',
                  }}
                >
                  ✓ 선택
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
