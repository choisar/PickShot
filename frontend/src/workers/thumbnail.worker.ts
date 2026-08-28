// Web Worker for off-thread thumbnail generation and pHash extraction using OffscreenCanvas

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

    // Compute 64-bit dHash (perceptual difference hash)
    let pHash = '';
    try {
      const hashCanvas = new OffscreenCanvas(9, 8);
      const hashCtx = hashCanvas.getContext('2d', { willReadFrequently: true });
      if (hashCtx) {
        hashCtx.drawImage(bitmap, 0, 0, 9, 8);
        const imgData = hashCtx.getImageData(0, 0, 9, 8).data;
        const gray: number[] = [];
        for (let i = 0; i < imgData.length; i += 4) {
          gray.push(0.299 * imgData[i] + 0.587 * imgData[i + 1] + 0.114 * imgData[i + 2]);
        }
        let binary = '';
        for (let row = 0; row < 8; row++) {
          for (let col = 0; col < 8; col++) {
            binary += gray[row * 9 + col] < gray[row * 9 + col + 1] ? '1' : '0';
          }
        }
        for (let i = 0; i < 64; i += 4) {
          pHash += parseInt(binary.slice(i, i + 4), 2).toString(16);
        }
        pHash = pHash.padStart(16, '0');
      }
    } catch (hashErr) {
      console.warn('pHash calculation failed:', hashErr);
    }

    bitmap.close();

    const blob = await canvas.convertToBlob({ type: 'image/webp', quality });

    self.postMessage({
      id,
      success: true,
      blob,
      pHash,
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
