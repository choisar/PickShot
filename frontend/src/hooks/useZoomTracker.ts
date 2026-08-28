import { useCallback } from 'react';
import { useCurationStore } from '../stores/curationStore';
import { ZoomCoordinates } from '../types/curation';

export function useZoomTracker() {
  const { logZoom } = useCurationStore();

  const trackZoomInteraction = useCallback(
    (imageId: string, x: number, y: number, scale: number) => {
      const coords: ZoomCoordinates = {
        x: Math.round(x * 100) / 100,
        y: Math.round(y * 100) / 100,
        scale: Math.round(scale * 10) / 10,
      };

      logZoom(imageId, coords);
    },
    [logZoom]
  );

  return { trackZoomInteraction };
}
