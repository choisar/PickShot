import React, { useState } from 'react';
import { ImageGroup } from '../../types/image';
import { ImageCard } from './ImageCard';
import { Button } from '../common/Button';

interface GroupGridProps {
  groups: ImageGroup[];
  onSelectBest: (groupId: string, imageId: string) => void;
  onOpenCompare: (groupId: string, imageId: string) => void;
  onConfirmGroup: (groupId: string) => void;
  onMoveImage: (sourceGroupId: string, targetGroupId: string, imageId: string) => void;
  onMergeGroups: (firstGroupId: string, secondGroupId: string) => void;
  onCreateGroupBetween: (insertIndex: number) => void;
  onDeleteGroup: (groupId: string) => void;
}

export const GroupGrid: React.FC<GroupGridProps> = ({
  groups,
  onSelectBest,
  onOpenCompare,
  onConfirmGroup,
  onMoveImage,
  onMergeGroups,
  onCreateGroupBetween,
  onDeleteGroup,
}) => {
  const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent<HTMLElement>, groupId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverGroupId !== groupId) {
      setDragOverGroupId(groupId);
    }
  };

  const handleDragLeave = (groupId: string) => {
    if (dragOverGroupId === groupId) {
      setDragOverGroupId(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLElement>, targetGroupId: string) => {
    e.preventDefault();
    setDragOverGroupId(null);

    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (!dataStr) return;
      const { groupId: sourceGroupId, imageId } = JSON.parse(dataStr);
      if (sourceGroupId && imageId && sourceGroupId !== targetGroupId) {
        onMoveImage(sourceGroupId, targetGroupId, imageId);
      }
    } catch (err) {
      console.error('Failed to parse drag-drop data:', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Add Group Button */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={() => onCreateGroupBetween(0)}
          style={{
            padding: '8px 16px',
            borderRadius: '20px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px dashed rgba(255, 255, 255, 0.25)',
            color: '#94a3b8',
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)';
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.borderColor = 'var(--accent-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.color = '#94a3b8';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
          }}
        >
          ➕ 최상단에 새 그룹 생성
        </button>
      </div>

      {groups.map((group, index) => {
        const isDragTarget = dragOverGroupId === group.id;
        const bestIds = group.bestImageIds || (group.bestImageId ? [group.bestImageId] : []);
        const nextGroup = groups[index + 1];

        return (
          <React.Fragment key={group.id}>
            <section
              onDragOver={(e) => handleDragOver(e, group.id)}
              onDragLeave={() => handleDragLeave(group.id)}
              onDrop={(e) => handleDrop(e, group.id)}
              className="glass-panel"
              style={{
                padding: '24px',
                borderRadius: 'var(--radius-lg)',
                border: isDragTarget
                  ? '2px dashed var(--accent-primary)'
                  : group.isConfirmed
                  ? '1px solid rgba(16, 185, 129, 0.4)'
                  : '1px solid var(--border-color)',
                background: isDragTarget ? 'rgba(99, 102, 241, 0.1)' : undefined,
                transition: 'all 0.2s ease',
                position: 'relative',
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{group.name}</span>
                    <span
                      style={{
                        fontSize: '0.85rem',
                        color: 'var(--text-secondary)',
                        fontWeight: 400,
                      }}
                    >
                      ({group.images.length}장)
                    </span>
                  </h3>

                  {bestIds.length > 0 && (
                    <span
                      style={{
                        fontSize: '0.8rem',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background: 'rgba(99, 102, 241, 0.2)',
                        color: 'var(--accent-primary)',
                        fontWeight: 600,
                      }}
                    >
                      ⭐ 베스트 픽 {bestIds.length}장 선택됨
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Button
                    variant={group.isConfirmed ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={() => onConfirmGroup(group.id)}
                  >
                    {group.isConfirmed ? '✓ 확정 완료' : '이 그룹 확정'}
                  </Button>

                  <button
                    onClick={() => onDeleteGroup(group.id)}
                    title="그룹 삭제"
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#f87171',
                      borderRadius: 'var(--radius-sm)',
                      padding: '6px 10px',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)')}
                  >
                    그룹 삭제
                  </button>
                </div>
              </div>

              {/* Images Grid or Empty Dropzone */}
              {group.images.length > 0 ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                    gap: '16px',
                  }}
                >
                  {group.images.map((image) => (
                    <ImageCard
                      key={image.id}
                      groupId={group.id}
                      image={image}
                      isAiRecommended={group.aiSuggestedBestId === image.id}
                      isSelected={bestIds.includes(image.id)}
                      score={group.scores?.[image.id]}
                      onToggleSelect={(imgId) => onSelectBest(group.id, imgId)}
                      onOpenCompare={(imgId) => onOpenCompare(group.id, imgId)}
                    />
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    padding: '36px',
                    borderRadius: 'var(--radius-md)',
                    border: '2px dashed rgba(255, 255, 255, 0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    color: 'var(--text-muted)',
                    background: 'rgba(0, 0, 0, 0.2)',
                  }}
                >
                  <span style={{ fontSize: '1.5rem' }}>📥</span>
                  <p style={{ fontSize: '0.9rem' }}>비어있는 그룹입니다. 다른 그룹의 사진을 이곳으로 드래그하여 이동하세요.</p>
                </div>
              )}
            </section>

            {/* Inter-group Action Bar (Merge & Insert Group) */}
            {nextGroup && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  margin: '4px 0',
                }}
              >
                <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />

                <button
                  onClick={() => onMergeGroups(group.id, nextGroup.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '16px',
                    background: 'rgba(99, 102, 241, 0.15)',
                    border: '1px solid rgba(99, 102, 241, 0.4)',
                    color: '#c7d2fe',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(99, 102, 241, 0.3)';
                    e.currentTarget.style.borderColor = 'var(--accent-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)';
                    e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
                  }}
                >
                  🔗 {group.name} & {nextGroup.name} 병합
                </button>

                <button
                  onClick={() => onCreateGroupBetween(index + 1)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '16px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px dashed rgba(255, 255, 255, 0.25)',
                    color: '#94a3b8',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.color = '#94a3b8';
                  }}
                >
                  ➕ 사이에 새 그룹 추가
                </button>

                <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
              </div>
            )}
          </React.Fragment>
        );
      })}

      {/* Bottom Add Group Button */}
      {groups.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
          <button
            onClick={() => onCreateGroupBetween(groups.length)}
            style={{
              padding: '8px 18px',
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px dashed rgba(255, 255, 255, 0.25)',
              color: '#94a3b8',
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)';
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.borderColor = 'var(--accent-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.color = '#94a3b8';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
            }}
          >
            ➕ 최하단에 새 그룹 생성
          </button>
        </div>
      )}
    </div>
  );
};
