// (2026-07-13) Client-side image compression engine. Prev: none
export type CompressOptions = {
  maxDimension?: number;
  quality?: number;
  outputType?: "blob" | "dataUrl";
};

function calculateDimensions(width: number, height: number, maxDimension: number) {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height };
  }
  const scale = Math.min(maxDimension / width, maxDimension / height);
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

export async function compressImage(
  file: File | Blob,
  options: CompressOptions = {},
): Promise<Blob | string> {
  const { maxDimension = 1280, quality = 0.72, outputType = "blob" } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to load image into memory"));
      img.onload = () => {
        const { width, height } = calculateDimensions(img.width, img.height, maxDimension);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) {
          reject(new Error("Canvas context unavailable"));
          return;
        }

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        if (outputType === "dataUrl") {
          const dataUrl = canvas.toDataURL("image/jpeg", quality);
          resolve(dataUrl);
        } else {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Canvas compression failed"));
                return;
              }
              resolve(blob);
            },
            "image/jpeg",
            quality,
          );
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// (2026-07-13) Instant compact base64 upload & recompression. Prev: 4.5s timeout
export async function recompressDataUrl(
  src: string,
  maxDimension = 720,
  quality = 0.56,
): Promise<string> {
  if (!src || (!src.startsWith("data:") && !src.startsWith("blob:"))) return src;
  return new Promise((resolve) => {
    const img = new Image();
    img.onerror = () => resolve(src);
    img.onload = () => {
      const { width, height } = calculateDimensions(img.width, img.height, maxDimension);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) return resolve(src);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.src = src;
  });
}

export async function uploadBlogImage(
  file: File,
  _storage?: any,
  _storageHelpers?: {
    ref: any;
    uploadBytes: any;
    getDownloadURL: any;
  },
): Promise<string> {
  const dataUrl = (await compressImage(file, {
    maxDimension: 800,
    quality: 0.62,
    outputType: "dataUrl",
  })) as string;
  return dataUrl;
}
