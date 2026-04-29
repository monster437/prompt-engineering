import {
  IMAGE_ASPECT_RATIOS,
  type ImageAspectRatio,
  type ImageCatalogAspectRatioOptionDto
} from "@/lib/types";

export const DEFAULT_IMAGE_ASPECT_RATIO: ImageAspectRatio = "auto";

const IMAGE_ASPECT_RATIO_OPTION_MAP: Record<ImageAspectRatio, {
  label: string;
  displayAspectRatio: string;
  resolution: string | null;
  width: number | null;
  height: number | null;
}> = {
  auto: {
    label: "auto（自动）",
    displayAspectRatio: "auto",
    resolution: "auto",
    width: null,
    height: null
  },
  "16:9@1792x1024": {
    label: "16:9（1792x1024）",
    displayAspectRatio: "16:9",
    resolution: "1792x1024",
    width: 1792,
    height: 1024
  },
  "16:9@1280x720": {
    label: "16:9（1280x720）",
    displayAspectRatio: "16:9",
    resolution: "1280x720",
    width: 1280,
    height: 720
  },
  "9:16@1024x1792": {
    label: "9:16（1024x1792）",
    displayAspectRatio: "9:16",
    resolution: "1024x1792",
    width: 1024,
    height: 1792
  },
  "9:16@720x1280": {
    label: "9:16（720x1280）",
    displayAspectRatio: "9:16",
    resolution: "720x1280",
    width: 720,
    height: 1280
  },
  "2:3": {
    label: "2:3",
    displayAspectRatio: "2:3",
    resolution: null,
    width: null,
    height: null
  },
  "3:2": {
    label: "3:2",
    displayAspectRatio: "3:2",
    resolution: null,
    width: null,
    height: null
  },
  "4:3": {
    label: "4:3",
    displayAspectRatio: "4:3",
    resolution: null,
    width: null,
    height: null
  },
  "3:4": {
    label: "3:4",
    displayAspectRatio: "3:4",
    resolution: null,
    width: null,
    height: null
  },
  "1:1@1024x1024": {
    label: "1:1（1024x1024）",
    displayAspectRatio: "1:1",
    resolution: "1024x1024",
    width: 1024,
    height: 1024
  }
};

const LEGACY_IMAGE_ASPECT_RATIO_NORMALIZATION_MAP: Record<string, ImageAspectRatio> = {
  "16:9": "16:9@1792x1024",
  "9:16": "9:16@1024x1792",
  "1:1": "1:1@1024x1024",
  "2:3": "2:3",
  "3:2": "3:2",
  "4:3": "4:3",
  "3:4": "3:4"
};

export function normalizeStoredImageAspectRatio(value: string | null | undefined): ImageAspectRatio {
  if (!value) {
    return DEFAULT_IMAGE_ASPECT_RATIO;
  }

  if (value in LEGACY_IMAGE_ASPECT_RATIO_NORMALIZATION_MAP) {
    return LEGACY_IMAGE_ASPECT_RATIO_NORMALIZATION_MAP[value];
  }

  return IMAGE_ASPECT_RATIOS.includes(value as ImageAspectRatio)
    ? (value as ImageAspectRatio)
    : DEFAULT_IMAGE_ASPECT_RATIO;
}

export function getDisplayAspectRatio(aspectRatio: ImageAspectRatio) {
  return IMAGE_ASPECT_RATIO_OPTION_MAP[aspectRatio].displayAspectRatio;
}

export function getImageAspectRatioLabel(aspectRatio: ImageAspectRatio) {
  return IMAGE_ASPECT_RATIO_OPTION_MAP[aspectRatio].label;
}

export function getImageSizeForAspectRatio(aspectRatio: ImageAspectRatio) {
  return IMAGE_ASPECT_RATIO_OPTION_MAP[aspectRatio].resolution;
}

export function buildImageAspectRatioOptions(): ImageCatalogAspectRatioOptionDto[] {
  return IMAGE_ASPECT_RATIOS.map((aspectRatio) => {
    const option = IMAGE_ASPECT_RATIO_OPTION_MAP[aspectRatio];

    return {
      value: aspectRatio,
      label: option.label,
      resolution: option.resolution,
      width: option.width,
      height: option.height
    };
  });
}
