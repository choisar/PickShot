/**
 * Perceptual Hash (dHash / Difference Hash) & Visual Similarity Utilities
 * Fast, lightweight 64-bit fingerprinting suitable for Web Workers and client-side 2nd-stage clustering.
 */

/**
 * Computes a 64-bit difference hash (dHash) from an ImageBitmap or OffscreenCanvas.
 * Resizes to 9x8 grayscale and compares adjacent horizontal pixels.
 */
export function computeDHashFromCanvas(
  ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D
): string {
  // Draw downscaled 9x8 to sample 72 pixels
  const smallCanvas = new OffscreenCanvas(9, 8);
  const smallCtx = smallCanvas.getContext('2d', { willReadFrequently: true });
  if (!smallCtx) return '0'.repeat(16);

  smallCtx.drawImage(ctx.canvas as CanvasImageSource, 0, 0, 9, 8);
  const imgData = smallCtx.getImageData(0, 0, 9, 8).data;

  // Convert to grayscale luminance: 0.299R + 0.587G + 0.114B
  const gray: number[] = [];
  for (let i = 0; i < imgData.length; i += 4) {
    const lum = 0.299 * imgData[i] + 0.587 * imgData[i + 1] + 0.114 * imgData[i + 2];
    gray.push(lum);
  }

  // 8 rows, 8 differences per row = 64 bits
  let binaryString = '';
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const left = gray[row * 9 + col];
      const right = gray[row * 9 + col + 1];
      binaryString += left < right ? '1' : '0';
    }
  }

  // Convert 64-bit binary to 16 hex characters
  let hexString = '';
  for (let i = 0; i < 64; i += 4) {
    const nibble = binaryString.slice(i, i + 4);
    hexString += parseInt(nibble, 2).toString(16);
  }

  return hexString.padStart(16, '0');
}

/**
 * Computes Hamming Distance between two 16-character hex dHash strings (0 to 64).
 */
export function computeHammingDistance(hashA: string, hashB: string): number {
  if (!hashA || !hashB || hashA.length !== hashB.length) return 64;

  let distance = 0;
  for (let i = 0; i < hashA.length; i++) {
    const valA = parseInt(hashA[i], 16);
    const valB = parseInt(hashB[i], 16);
    let xor = valA ^ valB;
    // Count set bits in 4-bit nibble
    while (xor > 0) {
      distance += xor & 1;
      xor >>= 1;
    }
  }
  return distance;
}

/**
 * Returns visual similarity ratio between 0.0 (completely different) and 1.0 (identical).
 */
export function computeHashSimilarity(hashA: string, hashB: string): number {
  const dist = computeHammingDistance(hashA, hashB);
  return Math.max(0, (64 - dist) / 64);
}
