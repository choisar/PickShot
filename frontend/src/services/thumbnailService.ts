import { APP_CONFIG } from '../utils/constants';

export interface ThumbnailResult {
  blob: Blob;
  pHash: string;
  width: number;
  height: number;
}

/**
 * Offloads thumbnail generation and pHash extraction to Web Worker
 */
export async function generateThumbnailWithWorker(file: File, id: string): Promise<ThumbnailResult> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('../workers/thumbnail.worker.ts', import.meta.url), {
      type: 'module',
    });

    worker.onmessage = (e: MessageEvent) => {
      worker.terminate();
      if (e.data.success) {
        resolve({
          blob: e.data.blob,
          pHash: e.data.pHash || '',
          width: e.data.width,
          height: e.data.height,
        });
      } else {
        reject(new Error(e.data.error || 'Failed to generate thumbnail'));
      }
    };

    worker.onerror = (err) => {
      worker.terminate();
      reject(err);
    };

    worker.postMessage({
      file,
      id,
      maxDim: APP_CONFIG.THUMBNAIL_MAX_DIMENSION,
      quality: APP_CONFIG.THUMBNAIL_QUALITY,
    });
  });
}
