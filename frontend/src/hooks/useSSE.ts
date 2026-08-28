import { useEffect, useRef, useCallback } from 'react';
import { apiService } from '../services/api';
import { useCurationStore } from '../stores/curationStore';
import { SSECurateEvent } from '../types/api';

export function useSSE() {
  const eventSourceRef = useRef<EventSource | null>(null);
  const { updateGroup, updateImageScore, setProgress } = useCurationStore();

  const connectSSE = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = apiService.createEventSource();
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data: SSECurateEvent = JSON.parse(event.data);

        if (data.type === 'group_analyzed' && data.groupId) {
          if (data.bestImageId) {
            updateGroup(data.groupId, {
              bestImageId: data.bestImageId,
              bestImageIds: [data.bestImageId],
              aiSuggestedBestId: data.bestImageId,
            });
          }

          if (data.scores) {
            Object.entries(data.scores).forEach(([imageId, score]) => {
              updateImageScore(data.groupId!, imageId, score);
            });
          }
        } else if (data.type === 'progress' && data.progress !== undefined) {
          setProgress({
            percentage: data.progress,
            statusMessage: data.message || 'AI 모델이 베스트 샷을 선별하고 있습니다...',
          });
        }
      } catch (err) {
        console.error('Failed to parse SSE event message:', err);
      }
    };

    es.onerror = (err) => {
      console.warn('SSE connection error or closed:', err);
      es.close();
    };
  }, [updateGroup, updateImageScore, setProgress]);

  const disconnectSSE = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      disconnectSSE();
    };
  }, [disconnectSSE]);

  return { connectSSE, disconnectSSE };
}
