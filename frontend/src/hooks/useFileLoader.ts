import { useState, useCallback } from 'react';
import { useCurationStore } from '../stores/curationStore';
import { extractExifDate } from '../utils/exif';
import { ImageMetadata } from '../types/image';
import { APP_CONFIG } from '../utils/constants';
import { chunkArray } from '../utils/chunk';

export function useFileLoader() {
  const [isLoading, setIsLoading] = useState(false);
  const { setRawFiles, setProgress } = useCurationStore();

  const loadFiles = useCallback(
    async (files: File[]): Promise<ImageMetadata[]> => {
      setIsLoading(true);
      setRawFiles(files);

      const totalFiles = files.length;
      setProgress({
        stage: 'reading',
        totalFiles,
        processedFiles: 0,
        percentage: 0,
        statusMessage: `파일 ${totalFiles}개 메타데이터 분석 중...`,
      });

      const results: ImageMetadata[] = [];
      const chunks = chunkArray(files, APP_CONFIG.CHUNK_BATCH_SIZE);
      let processed = 0;

      for (const chunk of chunks) {
        const chunkResults = await Promise.all(
          chunk.map(async (file, idx) => {
            const dateTimeOriginal = await extractExifDate(file);
            return {
              id: `img_${Date.now()}_${processed + idx}_${Math.random().toString(36).substring(2, 7)}`,
              file,
              name: file.name,
              size: file.size,
              type: file.type,
              lastModified: file.lastModified,
              dateTimeOriginal,
            };
          })
        );

        results.push(...chunkResults);
        processed += chunk.length;

        setProgress({
          processedFiles: processed,
          percentage: Math.round((processed / totalFiles) * 30),
          statusMessage: `EXIF 파싱 중 (${processed}/${totalFiles})...`,
        });
      }

      setIsLoading(false);
      return results;
    },
    [setRawFiles, setProgress]
  );

  return { loadFiles, isLoading };
}
