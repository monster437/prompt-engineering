import {
  MAX_SOURCE_PROMPT_IMAGE_SIZE_BYTES,
  type SourcePromptImage
} from "@/lib/types";

export function createSourcePromptImageId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `prompt-image-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function formatSourcePromptImageFileSize(sizeBytes: number) {
  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function splitImageFiles(files: File[]) {
  const imageFiles: File[] = [];
  const invalidFiles: string[] = [];

  for (const file of files) {
    if (file.type.startsWith("image/")) {
      imageFiles.push(file);
      continue;
    }

    invalidFiles.push(file.name || "未命名文件");
  }

  return { imageFiles, invalidFiles };
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error(`读取图片失败：${file.name}`));
    };

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error(`读取图片失败：${file.name}`));
        return;
      }

      resolve(reader.result);
    };

    reader.readAsDataURL(file);
  });
}

export async function toSourcePromptImage(file: File): Promise<SourcePromptImage> {
  if (!file.type.startsWith("image/")) {
    throw new Error(`仅支持上传图片文件：${file.name}`);
  }

  if (file.size > MAX_SOURCE_PROMPT_IMAGE_SIZE_BYTES) {
    throw new Error(
      `图片过大：${file.name}，请控制在 ${formatSourcePromptImageFileSize(MAX_SOURCE_PROMPT_IMAGE_SIZE_BYTES)} 以内。`
    );
  }

  return {
    id: createSourcePromptImageId(),
    name: file.name,
    mimeType: file.type,
    dataUrl: await readFileAsDataUrl(file),
    sizeBytes: file.size
  };
}
