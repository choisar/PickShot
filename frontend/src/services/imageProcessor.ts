import { APP_CONFIG } from '../utils/constants';

/**
 * Resizes an image file to a WebP thumbnail (1080px max) with memory safety.
 */
export async function createThumbnail(
  file: File,
  maxDimension = APP_CONFIG.THUMBNAIL_MAX_DIMENSION,
  quality = APP_CONFIG.THUMBNAIL_QUALITY
): Promise<{ blob: Blob; url: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get 2D canvas context.'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas toBlob conversion returned null.'));
            return;
          }
          const url = URL.createObjectURL(blob);
          resolve({ blob, url, width, height });
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Failed to load image for thumbnail creation: ${file.name}`));
    };

    img.src = objectUrl;
  });
}
