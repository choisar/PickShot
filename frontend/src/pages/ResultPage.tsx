import React, { useState } from 'react';
import { useCurationStore } from '../stores/curationStore';
import { fileSystemService } from '../services/fileSystem';
import { apiService } from '../services/api';
import { Button } from '../components/common/Button';
import { ProgressBar } from '../components/common/ProgressBar';

export const ResultPage: React.FC = () => {
  const { groups, setStep, zoomLogs } = useCurationStore();
  const [isSaving, setIsSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [saveComplete, setSaveComplete] = useState(false);

  const selectedImages = groups.flatMap((g) => {
    const bestIds = g.bestImageIds || (g.bestImageId ? [g.bestImageId] : []);
    return g.images
      .filter((img) => bestIds.includes(img.id))
      .map((img) => ({ group: g, image: img }));
  });

  const handleExportZeroEgress = async () => {
    try {
      setIsSaving(true);
      const filesToSave = selectedImages.map((item) => ({
        file: item.image.file,
        targetName: `best_${item.image.name}`,
      }));

      await fileSystemService.saveFilesToDirectory(filesToSave, (count) => {
        setSavedCount(count);
      });

      // Submit feedback & pairwise attention data to server
      for (const item of selectedImages) {
        const loserIds = item.group.images
          .filter((img) => img.id !== item.image.id)
          .map((img) => img.id);

        const zoomHistory = zoomLogs[item.image.id];
        const lastZoom = zoomHistory && zoomHistory.length > 0 ? zoomHistory[zoomHistory.length - 1] : undefined;

        await apiService.submitFeedback({
          groupId: item.group.id,
          winnerImageId: item.image.id,
          loserImageIds: loserIds,
          isUserModified: item.group.aiSuggestedBestId !== item.image.id,
          zoomAttention: lastZoom,
        });
      }

      setSaveComplete(true);
    } catch (err) {
      console.error('Save failed:', err);
      alert('저장 중 오류가 발생했습니다: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', textAlign: 'center' }}>
      <div
        className="glass-panel"
        style={{
          padding: '40px',
          borderRadius: 'var(--radius-xl)',
        }}
      >
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎉</div>
        <h2 style={{ fontSize: '2rem', marginBottom: '12px' }}>
          총 {selectedImages.length}장의 베스트 컷이 선정되었습니다!
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
          File System API를 활용하여 사용자가 지정한 폴더에 원본 고화질로 즉시 저장됩니다.
        </p>

        {isSaving && (
          <div style={{ marginBottom: '24px' }}>
            <ProgressBar
              progress={Math.round((savedCount / selectedImages.length) * 100)}
              label={`로컬 폴더에 원본 저장 중... (${savedCount}/${selectedImages.length})`}
            />
          </div>
        )}

        {saveComplete ? (
          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid var(--success)',
              color: 'var(--success)',
              fontWeight: 600,
              marginBottom: '24px',
            }}
          >
            ✓ 원본 저장이 완료되었습니다!
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <Button variant="ghost" onClick={() => setStep('curation')}>
              ← 큐레이션 다시 보기
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={handleExportZeroEgress}
              disabled={isSaving || selectedImages.length === 0}
            >
              {isSaving ? '저장 진행 중...' : '로컬 폴더에 원본 저장하기 (Zero-Egress)'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
