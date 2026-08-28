export type AppStep = 'upload' | 'processing' | 'curation' | 'result';

export interface ProcessingProgress {
  stage: 'reading' | 'exif' | 'thumbnail' | 'clustering' | 'ai_evaluating' | 'completed';
  totalFiles: number;
  processedFiles: number;
  totalGroups: number;
  evaluatedGroups: number;
  percentage: number;
  statusMessage: string;
}

export interface ZoomCoordinates {
  x: number;
  y: number;
  scale: number;
}
