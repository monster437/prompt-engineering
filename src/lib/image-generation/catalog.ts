import {
  IMAGE_ASPECT_RATIOS,
  type ImageAspectRatio,
  type ImageCatalogAspectRatioOptionDto
} from "@/lib/types";

export const DEFAULT_IMAGE_ASPECT_RATIO: ImageAspectRatio = "auto";

export function getImageSizeForAspectRatio(aspectRatio: ImageAspectRatio) {
  switch (aspectRatio) {
    case "auto":
      return "auto";
    case "1:1":
      return "1024x1024";
    case "16:9":
    case "3:2":
    case "4:3":
      return "1536x1024";
    case "9:16":
    case "2:3":
    case "3:4":
      return "1024x1536";
    default:
      return null;
  }
}

export function buildImageAspectRatioOptions(): ImageCatalogAspectRatioOptionDto[] {
  return IMAGE_ASPECT_RATIOS.map((aspectRatio) => {
    const resolution = getImageSizeForAspectRatio(aspectRatio);
    const parsedResolution = parseResolution(resolution);

    return {
      value: aspectRatio,
      label: aspectRatio === "auto" ? "auto（自动）" : aspectRatio,
      resolution,
      width: parsedResolution?.width ?? null,
      height: parsedResolution?.height ?? null
    };
  });
}

function parseResolution(resolution: string | null) {
  if (!resolution || resolution === "auto") {
    return null;
  }

  const match = /^(?<width>\d+)x(?<height>\d+)$/.exec(resolution);
  if (!match?.groups) {
    return null;
  }

  return {
    width: Number(match.groups.width),
    height: Number(match.groups.height)
  };
}
