export interface ImagePreprocessOptions {
  /** Target minimum width to scale up small images for better OCR resolution */
  minWidth?: number;
  /** Contrast enhancement factor (1.0 = normal, 1.5 = high contrast) */
  contrastBoost?: number;
  /** Local window size factor for Bradley-Roth adaptive thresholding (default ~0.125 = 1/8th of image width) */
  adaptiveWindowSizeRatio?: number;
  /** Percentage sensitivity for thresholding (default 15 = 15% darker than local average) */
  thresholdPercentage?: number;
}

/**
 * Pre-processes an image on the client side using HTML5 Canvas.
 * Applied Pipeline: Dynamic Scaling -> Grayscale -> Contrast Stretch -> Adaptive Bradley-Roth Thresholding.
 */
export async function preprocessImage(
  imageFile: File,
  options: ImagePreprocessOptions = {}
): Promise<string> {
  const {
    minWidth = 1800, // Scales up low-res package images to ~300 DPI equivalent
    contrastBoost = 1.2,
    adaptiveWindowSizeRatio = 0.125,
    thresholdPercentage = 15,
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(imageFile);

    img.onload = () => {
      // Always revoke Object URL to prevent browser memory leaks
      URL.revokeObjectURL(objectUrl);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (!ctx) {
        reject(new Error('Canvas 2D context not available'));
        return;
      }

      // 1. Calculate Target Scale (Upscale small text for OCR accuracy)
      let width = img.width;
      let height = img.height;

      if (width < minWidth) {
        const scale = minWidth / width;
        width = minWidth;
        height = Math.round(height * scale);
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and scale image
      ctx.drawImage(img, 0, 0, width, height);

      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      const numPixels = width * height;

      // 2. Grayscale & Contrast Stretching Vector Pass
      const grayscale = new Uint8Array(numPixels);
      let minVal = 255;
      let maxVal = 0;

      for (let i = 0; i < numPixels; i++) {
        const offset = i * 4;
        // High accuracy Rec. 709 Luminance Formula
        const gray = Math.round(
          0.2126 * data[offset] +
          0.7152 * data[offset + 1] +
          0.0722 * data[offset + 2]
        );

        grayscale[i] = gray;
        if (gray < minVal) minVal = gray;
        if (gray > maxVal) maxVal = gray;
      }

      // Stretch contrast if range is compressed
      const range = maxVal - minVal || 1;

      // 3. Integral Image Construction for Fast $O(1)$ Adaptive Thresholding
      const integralImage = new Float64Array(numPixels);
      
      for (let x = 0; x < width; x++) {
        let sum = 0;
        for (let y = 0; y < height; y++) {
          const idx = y * width + x;
          // Apply contrast boost during integral accumulation
          let normalized = ((grayscale[idx] - minVal) / range) * 255 * contrastBoost;
          normalized = Math.min(255, Math.max(0, normalized));
          
          sum += normalized;
          if (x === 0) {
            integralImage[idx] = sum;
          } else {
            integralImage[idx] = integralImage[idx - 1] + sum;
          }
        }
      }

      // 4. Bradley-Roth Local Adaptive Thresholding Pass
      const S = Math.max(1, Math.floor(width * adaptiveWindowSizeRatio));
      const s2 = Math.floor(S / 2);
      const t = (100 - thresholdPercentage) / 100;

      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          const x1 = Math.max(x - s2, 0);
          const x2 = Math.min(x + s2, width - 1);
          const y1 = Math.max(y - s2, 0);
          const y2 = Math.min(y + s2, height - 1);

          const count = (x2 - x1) * (y2 - y1);

          // Calculate sum of local region using Integral Image
          const idxTopRight = y1 * width + x2;
          const idxBottomRight = y2 * width + x2;
          const idxTopLeft = y1 * width + x1;
          const idxBottomLeft = y2 * width + x1;

          const sum =
            integralImage[idxBottomRight] -
            integralImage[idxTopRight] -
            integralImage[idxBottomLeft] +
            integralImage[idxTopLeft];

          const pixelIdx = y * width + x;
          const pixelOffset = pixelIdx * 4;
          const currentPixelVal = grayscale[pixelIdx];

          // Binarize based on local neighbourhood brightness
          const binarized = currentPixelVal * count < sum * t ? 0 : 255;

          data[pixelOffset] = binarized;     // R
          data[pixelOffset + 1] = binarized; // G
          data[pixelOffset + 2] = binarized; // B
          data[pixelOffset + 3] = 255;       // Alpha
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };

    img.src = objectUrl;
  });
}