import React, { useState, useEffect } from 'react';
import { useCurationStore } from '../stores/curationStore';
import { useSSE } from '../hooks/useSSE';
import { GroupGrid } from '../components/viewer/GroupGrid';
import { CompareModal } from '../components/viewer/CompareModal';
import { Button } from '../components/common/Button';

export const CurationPage: React.FC = () => {
  const {
    groups,
    toggleBestImage,
    confirmGroup,
    moveImageToGroup,
    mergeGroups,
    createGroupBetween,
    deleteGroup,
    setStep,
  } = useCurationStore();
  const { connectSSE, disconnectSSE } = useSSE();

  const [compareGroupId, setCompareGroupId] = useState<string | null>(null);
  const [compareImageId, setCompareImageId] = useState<string | undefined>(undefined);

  useEffect(() => {
    connectSSE();
    return () => {
      disconnectSSE();
    };
  }, [connectSSE, disconnectSSE]);

  const activeGroup = groups.find((g) => g.id === compareGroupId) || null;

  const handleOpenCompare = (groupId: string, imageId: string) => {
    setCompareGroupId(groupId);
    setCompareImageId(imageId);
  };

  const handleCloseCompare = () => {
    setCompareGroupId(null);
    setCompareImageId(undefined);
  };

  const totalBestCount = groups.reduce((acc, g) => {
    const ids = g.bestImageIds || (g.bestImageId ? [g.bestImageId] : []);
    return acc + ids.length;
  }, 0);

  const allConfirmed = groups.length > 0 && groups.every((g) => g.isConfirmed);

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.75rem' }}>AI 베스트 컷 큐레이션</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            총 {groups.length}개 그룹 • 선별된 베스트 컷 {totalBestCount}장 (사진을 다른 그룹으로 드래그하거나 그룹 간 병합/추가가 가능합니다)
          </p>
        </div>

        <Button
          variant="primary"
          size="lg"
          onClick={() => setStep('result')}
          disabled={groups.length === 0}
        >
          {allConfirmed ? '선택 완료 & 저장하기 →' : '전체 결과 확정하기 →'}
        </Button>
      </div>

      <GroupGrid
        groups={groups}
        onSelectBest={toggleBestImage}
        onOpenCompare={handleOpenCompare}
        onConfirmGroup={confirmGroup}
        onMoveImage={moveImageToGroup}
        onMergeGroups={mergeGroups}
        onCreateGroupBetween={createGroupBetween}
        onDeleteGroup={deleteGroup}
      />

      <CompareModal
        isOpen={!!compareGroupId}
        group={activeGroup}
        selectedImageId={compareImageId}
        onClose={handleCloseCompare}
        onSelectBest={(imgId) => {
          if (compareGroupId) {
            toggleBestImage(compareGroupId, imgId);
          }
        }}
      />
    </div>
  );
};
