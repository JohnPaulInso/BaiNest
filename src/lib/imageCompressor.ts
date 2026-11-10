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

// (2026-07-13) Add upload timeout race & base64 fallback. Prev: hung uploads
export async function uploadBlogImage(
  file: File,
  storage?: any,
  storageHelpers?: {
    ref: any;
    uploadBytes: any;
    getDownloadURL: any;
  },
): Promise<string> {
  // Try Firebase Cloud Storage if initialized
  if (storage && storageHelpers?.ref && storageHelpers?.uploadBytes && storageHelpers?.getDownloadURL) {
    try {
      const blob = (await compressImage(file, {
        maxDimension: 1280,
        quality: 0.72,
        outputType: "blob",
      })) as Blob;
      const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const storageRef = storageHelpers.ref(
        storage,
        `blog-images/${Date.now()}_${cleanName}`,
      );
      const uploadPromise = (async () => {
        const snapshot = await storageHelpers.uploadBytes(storageRef, blob, {
          contentType: "image/jpeg",
        });
        return await storageHelpers.getDownloadURL(snapshot.ref);
      })();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Storage timeout")), 4500)
      );
      return await Promise.race([uploadPromise, timeoutPromise]);
    } catch {
      // Storage blocked or timed out; fallback to inline compressed dataUrl
    }
  }

  // Fallback: Ultra-compact lightweight Base64 dataUrl (850px, quality 0.68)
  const dataUrl = (await compressImage(file, {
    maxDimension: 850,
    quality: 0.68,
    outputType: "dataUrl",
  })) as string;
  return dataUrl;
}
