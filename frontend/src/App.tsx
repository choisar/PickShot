import React, { useEffect } from 'react';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/HomePage';
import { CurationPage } from './pages/CurationPage';
import { ResultPage } from './pages/ResultPage';
import { useCurationStore } from './stores/curationStore';
import { useIndexedDB } from './hooks/useIndexedDB';

export const App: React.FC = () => {
  const { currentStep } = useCurationStore();
  const { restoreCheckpoint } = useIndexedDB();

  useEffect(() => {
    // Restore any previous checkpoint on mount
    restoreCheckpoint();
  }, [restoreCheckpoint]);

  return (
    <Layout>
      {currentStep === 'upload' && <HomePage />}
      {currentStep === 'processing' && <HomePage />}
      {currentStep === 'curation' && <CurationPage />}
      {currentStep === 'result' && <ResultPage />}
    </Layout>
  );
};

export default App;
