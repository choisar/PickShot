// Web Worker for off-thread thumbnail generation using OffscreenCanvas

self.onmessage = async (e: MessageEvent<{ file: File; id: string; maxDim: number; quality: number }>) => {
  const { file, id, maxDim, quality } = e.data;

  try {
    const bitmap = await createImageBitmap(file);
    let { width, height } = bitmap;

    if (width > height) {
      if (width > maxDim) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      }
    } else {
      if (height > maxDim) {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
    }

    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('OffscreenCanvas 2D context unavailable');

    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await canvas.convertToBlob({ type: 'image/webp', quality });

    self.postMessage({
      id,
      success: true,
      blob,
      width,
      height,
    });
  } catch (error) {
    self.postMessage({
      id,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown worker error',
    });
  }
};

export {};
