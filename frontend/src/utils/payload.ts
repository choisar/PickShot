import { ImageGroup } from '../types/image';
import { CurateGroupPayload } from '../types/api';
import { APP_CONFIG } from './constants';

/**
 * Converts a Blob to base64 string
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Strip data:image/...;base64, prefix if present
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Packages an ImageGroup into 10MB-compliant CurateGroupPayload chunks
 */
export async function prepareGroupCurationPayloads(group: ImageGroup): Promise<CurateGroupPayload[]> {
  const payloads: CurateGroupPayload[] = [];
  let currentImages: CurateGroupPayload['images'] = [];
  let currentEstimatedBytes = 0;

  for (const img of group.images) {
    let thumbnailBase64: string | undefined;
    let byteSize = 0;

    if (img.thumbnailBlob) {
      thumbnailBase64 = await blobToBase64(img.thumbnailBlob);
      byteSize = thumbnailBase64.length * 0.75; // Approx byte size of base64
    }

    const imagePayload = {
      id: img.id,
      filename: img.name,
      thumbnailBase64,
    };

    // If adding this image exceeds the 10MB limit (with safety margin 8MB), chunk it
    if (currentImages.length > 0 && currentEstimatedBytes + byteSize > APP_CONFIG.MAX_CHUNK_PAYLOAD_BYTES * 0.8) {
      payloads.push({
        groupId: group.id,
        images: currentImages,
      });
      currentImages = [];
      currentEstimatedBytes = 0;
    }

    currentImages.push(imagePayload);
    currentEstimatedBytes += byteSize;
  }

  if (currentImages.length > 0) {
    payloads.push({
      groupId: group.id,
      images: currentImages,
    });
  }

  return payloads;
}
