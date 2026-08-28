import { useCallback } from 'react';
import { ImageMetadata, ImageGroup } from '../types/image';
import { APP_CONFIG } from '../utils/constants';

export function useClustering() {
  const clusterImages = useCallback(
    (images: ImageMetadata[]): ImageGroup[] => {
      if (images.length === 0) return [];

      // Sort images chronologically by EXIF DateTimeOriginal or lastModified
      const sorted = [...images].sort((a, b) => {
        const timeA = (a.dateTimeOriginal || new Date(a.lastModified)).getTime();
        const timeB = (b.dateTimeOriginal || new Date(b.lastModified)).getTime();
        return timeA - timeB;
      });

      const groups: ImageGroup[] = [];
      let currentGroup: ImageMetadata[] = [];
      let groupIndex = 1;

      for (let i = 0; i < sorted.length; i++) {
        const current = sorted[i];

        if (currentGroup.length === 0) {
          currentGroup.push(current);
          continue;
        }

        const prev = currentGroup[currentGroup.length - 1];
        const prevTime = (prev.dateTimeOriginal || new Date(prev.lastModified)).getTime();
        const currTime = (current.dateTimeOriginal || new Date(current.lastModified)).getTime();
        const diffSeconds = Math.abs(currTime - prevTime) / 1000;

        if (diffSeconds <= APP_CONFIG.BURST_TIME_THRESHOLD_SECONDS) {
          currentGroup.push(current);
        } else {
          // Finish current group
          const startTime = currentGroup[0].dateTimeOriginal || new Date(currentGroup[0].lastModified);
          const endTime = currentGroup[currentGroup.length - 1].dateTimeOriginal || new Date(currentGroup[currentGroup.length - 1].lastModified);

          groups.push({
            id: `grp_${Date.now()}_${groupIndex++}`,
            name: `연사 그룹 #${groupIndex - 1}`,
            timestampRange: { start: startTime, end: endTime },
            images: [...currentGroup],
            bestImageId: currentGroup[0].id,
            bestImageIds: [currentGroup[0].id],
          });

          currentGroup = [current];
        }
      }

      // Add last remaining group
      if (currentGroup.length > 0) {
        const startTime = currentGroup[0].dateTimeOriginal || new Date(currentGroup[0].lastModified);
        const endTime = currentGroup[currentGroup.length - 1].dateTimeOriginal || new Date(currentGroup[currentGroup.length - 1].lastModified);

        groups.push({
          id: `grp_${Date.now()}_${groupIndex}`,
          name: `연사 그룹 #${groupIndex}`,
          timestampRange: { start: startTime, end: endTime },
          images: [...currentGroup],
          bestImageId: currentGroup[0].id,
          bestImageIds: [currentGroup[0].id],
        });
      }

      return groups;
    },
    []
  );

  return { clusterImages };
}
