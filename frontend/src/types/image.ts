export interface ImageMetadata {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  lastModified: number;
  dateTimeOriginal?: Date | null;
  thumbnailUrl?: string;
  thumbnailBlob?: Blob;
  pHash?: string;
  width?: number;
  height?: number;
}

export interface ImageGroup {
  id: string;
  name: string;
  timestampRange: {
    start: Date | null;
    end: Date | null;
  };
  images: ImageMetadata[];
  bestImageId?: string;
  bestImageIds?: string[];
  aiSuggestedBestId?: string;
  isConfirmed?: boolean;
  scores?: Record<string, ImageScore>;
}

export interface ImageScore {
  imageId: string;
  faceScore?: number;
  sharpnessScore?: number;
  preferenceScore?: number;
  totalScore?: number;
  isHardFiltered?: boolean;
  filterReason?: string;
}
