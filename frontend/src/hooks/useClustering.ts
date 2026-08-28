import { useCallback } from 'react';
import { ImageMetadata, ImageGroup } from '../types/image';
import { APP_CONFIG } from '../utils/constants';
import { computeHammingDistance } from '../utils/phash';

export function useClustering() {
  /**
   * Hybrid 2-Stage Clustering:
   * 1. EXIF Timestamp Clustering (when valid DateTimeOriginal exists)
   * 2. pHash Visual Similarity Clustering (for missing EXIF, KakaoTalk/SNS downloads, or scene changes)
   */
  const clusterImages = useCallback(
    (images: ImageMetadata[]): ImageGroup[] => {
      if (images.length === 0) return [];

      // Check if majority of images have genuine EXIF DateTimeOriginal
      const hasExifCount = images.filter((img) => !!img.dateTimeOriginal).length;
      const isExifReliable = hasExifCount / images.length >= 0.5;

      // Sort images chronologically if EXIF is reliable, else preserve upload/name order
      const sorted = [...images].sort((a, b) => {
        if (isExifReliable) {
          const timeA = (a.dateTimeOriginal || new Date(a.lastModified)).getTime();
          const timeB = (b.dateTimeOriginal || new Date(b.lastModified)).getTime();
          return timeA - timeB;
        }
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
      });

      const rawGroups: ImageMetadata[][] = [];
      let currentGroup: ImageMetadata[] = [];

      for (let i = 0; i < sorted.length; i++) {
        const current = sorted[i];

        if (currentGroup.length === 0) {
          currentGroup.push(current);
          continue;
        }

        const prev = currentGroup[currentGroup.length - 1];

        // 1. Time difference check
        let isTimeClose = false;
        if (isExifReliable && prev.dateTimeOriginal && current.dateTimeOriginal) {
          const diffSeconds = Math.abs(current.dateTimeOriginal.getTime() - prev.dateTimeOriginal.getTime()) / 1000;
          isTimeClose = diffSeconds <= APP_CONFIG.BURST_TIME_THRESHOLD_SECONDS;
        }

        // 2. pHash Visual similarity check
        let isVisuallySimilar = false;
        if (prev.pHash && current.pHash) {
          const distance = computeHammingDistance(prev.pHash, current.pHash);
          isVisuallySimilar = distance <= APP_CONFIG.PHASH_HAMMING_THRESHOLD;
        }

        // Clustering Decision:
        // If EXIF is available and reliable, use time closeness AND (if pHash exists) avoid grouping completely disparate scenes.
        // If EXIF is missing/unreliable, group primarily based on pHash visual similarity.
        let shouldGroupTogether = false;
        if (isExifReliable) {
          if (isTimeClose) {
            // If both have pHash, confirm they aren't completely disparate (distance <= 22)
            if (prev.pHash && current.pHash) {
              const distance = computeHammingDistance(prev.pHash, current.pHash);
              shouldGroupTogether = distance <= 22; // allows motion variation while blocking completely different scenes
            } else {
              shouldGroupTogether = true;
            }
          }
        } else {
          // EXIF missing (SNS/Kakao/Screenshots): Group by pHash visual similarity
          shouldGroupTogether = isVisuallySimilar;
        }

        if (shouldGroupTogether) {
          currentGroup.push(current);
        } else {
          rawGroups.push([...currentGroup]);
          currentGroup = [current];
        }
      }

      if (currentGroup.length > 0) {
        rawGroups.push([...currentGroup]);
      }

      // Convert raw groups into structured ImageGroup
      return rawGroups.map((group, idx) => {
        const startTime = group[0].dateTimeOriginal || new Date(group[0].lastModified);
        const endTime = group[group.length - 1].dateTimeOriginal || new Date(group[group.length - 1].lastModified);

        return {
          id: `grp_${Date.now()}_${idx + 1}`,
          name: `연사 그룹 #${idx + 1}`,
          timestampRange: { start: startTime, end: endTime },
          images: group,
          bestImageId: group[0].id,
          bestImageIds: [group[0].id],
          aiSuggestedBestId: group[0].id,
        };
      });
    },
    []
  );

  return { clusterImages };
}
