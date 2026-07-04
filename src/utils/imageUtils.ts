const DATA_URL_PATTERN = /^data:image\/(png|jpeg|jpg|webp|gif);base64,/i;

export function isBase64DataUrl(value: string): boolean {
  return DATA_URL_PATTERN.test(value.trim());
}

/** Chuyển chuỗi base64 thuần hoặc data URL thành src hợp lệ cho thẻ img */
export function toImageSrc(stored: string, mimeType = 'image/png'): string {
  const trimmed = stored.trim();
  if (isBase64DataUrl(trimmed)) return trimmed;
  return `data:${mimeType};base64,${trimmed.replace(/\s/g, '')}`;
}

export function validateImageFile(file: File, maxBytes: number): string | null {
  if (!file.type.startsWith('image/')) {
    return 'Vui lòng chọn file ảnh (JPG, PNG, WebP...).';
  }
  if (file.size > maxBytes) {
    return `Ảnh quá lớn. Vui lòng chọn ảnh dưới ${Math.round(maxBytes / 1024)}KB.`;
  }
  return null;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Không đọc được file ảnh.'));
    };
    reader.onerror = () => reject(new Error('Không đọc được file ảnh.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Không tải được ảnh.'));
    img.src = src;
  });
}

/** Encode file ảnh thành base64 data URL, resize nếu vượt maxDimension */
export async function encodeImageToBase64(
  file: File,
  options?: { maxDimension?: number; quality?: number }
): Promise<string> {
  const maxDimension = options?.maxDimension ?? 512;
  const quality = options?.quality ?? 0.85;

  const dataUrl = await readFileAsDataUrl(file);
  const img = await loadImage(dataUrl);

  const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
  const width = Math.round(img.width * scale);
  const height = Math.round(img.height * scale);

  if (scale >= 1 && file.type === 'image/jpeg') {
    return dataUrl;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
  return canvas.toDataURL(mime, quality);
}

export function estimateBase64Size(dataUrl: string): number {
  const base64 = dataUrl.split(',')[1] || dataUrl;
  return Math.ceil((base64.length * 3) / 4);
}
