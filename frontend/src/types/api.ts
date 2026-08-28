import { ImageScore } from './image';

export interface CurateGroupPayload {
  groupId: string;
  images: {
    id: string;
    filename: string;
    thumbnailBase64?: string;
  }[];
}

export interface CurateResponse {
  taskId: string;
  message: string;
  groupCount: number;
}

export interface SSECurateEvent {
  type: 'group_analyzed' | 'progress' | 'error' | 'done';
  groupId?: string;
  bestImageId?: string;
  scores?: Record<string, ImageScore>;
  progress?: number;
  message?: string;
}

export interface FeedbackPayload {
  groupId: string;
  winnerImageId: string;
  loserImageIds: string[];
  isUserModified: boolean;
  zoomAttention?: {
    x: number;
    y: number;
    scale: number;
  };
}
