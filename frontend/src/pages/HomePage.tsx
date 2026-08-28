import React, { useState } from 'react';
import { DropZone } from '../components/upload/DropZone';
import { ConsentDialog } from '../components/common/ConsentDialog';
import { UploadProgress } from '../components/upload/UploadProgress';
import { useFileLoader } from '../hooks/useFileLoader';
import { useClustering } from '../hooks/useClustering';
import { useCurationStore } from '../stores/curationStore';

export const HomePage: React.FC = () => {
  const [showConsent, setShowConsent] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { currentStep, setStep, setGroups } = useCurationStore();
  const { loadFiles } = useFileLoader();
  const { clusterImages } = useClustering();

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files);
    setShowConsent(true);
  };

  const handleConsentAccept = async () => {
    setShowConsent(false);
    setStep('processing');

    const metaList = await loadFiles(selectedFiles);
    const groups = clusterImages(metaList);
    setGroups(groups);

    // Transition to Curation Page once ready
    setStep('curation');
  };

  const handleConsentDecline = () => {
    setShowConsent(false);
    setSelectedFiles([]);
  };

  return (
    <div>
      {/* Hero Section */}
      <section style={{ textAlign: 'center', margin: '40px 0 60px' }}>
        <h1
          style={{
            fontSize: '3rem',
            marginBottom: '16px',
            lineHeight: 1.2,
          }}
        >
          수천 장의 연사 사진 중 <br />
          <span className="gradient-text">완벽한 베스트 샷</span>을 단 1초 만에
        </h1>
        <p
          style={{
            fontSize: '1.2rem',
            color: 'var(--text-secondary)',
            maxWidth: '680px',
            margin: '0 auto 32px',
          }}
        >
          눈 감은 사진과 흔들린 사진은 걸러내고, AI 딥러닝 모델이 가장 매력적인 표정과 구도의 컷을 자동으로 골라드립니다.
        </p>
      </section>

      {currentStep === 'upload' && (
        <DropZone onFilesSelected={handleFilesSelected} />
      )}

      {currentStep === 'processing' && <UploadProgress />}

      <ConsentDialog
        isOpen={showConsent}
        onAccept={handleConsentAccept}
        onDecline={handleConsentDecline}
      />
    </div>
  );
};
