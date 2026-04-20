import { describe, expect, it } from "vitest";

import {
  formatSelectedStyleLabels,
  formatSelectedStylePromptHints,
  getAutoCameraOrientationCandidates,
  getAutoCameraOrientationUiHint,
  getCameraOrientationLabel,
  getResolvedCameraOrientationPromptHint,
  getSelectedCameraOrientation,
  parseSelectedStyleTags,
  parseSelectedTargetPreferences,
  serializeSelectedStyleTags
} from "@/lib/style-tags";

describe("style tags helpers", () => {
  it("parses both legacy single values and serialized arrays", () => {
    expect(parseSelectedStyleTags("general")).toEqual(["general"]);
    expect(parseSelectedStyleTags('["xianxia","cute-romance"]')).toEqual(["xianxia", "cute-romance"]);
    expect(parseSelectedTargetPreferences('{"styleTags":["xianxia"],"cameraOrientation":"side"}')).toEqual({
      styleTags: ["xianxia"],
      cameraOrientation: "side"
    });
  });

  it("serializes deduplicated style tags", () => {
    expect(serializeSelectedStyleTags(["xianxia", "xianxia", "cute-romance"])).toBe(
      '{"styleTags":["xianxia","cute-romance"],"cameraOrientation":"auto"}'
    );
  });

  it("formats readable labels and prompt hints", () => {
    expect(formatSelectedStyleLabels('["xianxia","cute-romance"]')).toContain("玄幻修仙");
    expect(formatSelectedStyleLabels('["xianxia","cute-romance"]')).toContain("可爱言情");
    expect(formatSelectedStylePromptHints('["xianxia","cute-romance"]')).toContain("xianxia fantasy");
    expect(formatSelectedStylePromptHints('["xianxia","cute-romance"]')).toContain("cute romantic storytelling");
    expect(getSelectedCameraOrientation('{"styleTags":["xianxia"],"cameraOrientation":"back"}')).toBe("back");
    expect(getCameraOrientationLabel("over-shoulder")).toContain("越肩");
  });

  it("generates dynamic auto camera guidance from style tags", () => {
    const targetType = '{"styleTags":["xianxia","scene-narrative"],"cameraOrientation":"auto"}';

    expect(getAutoCameraOrientationCandidates(targetType)).toEqual(["distant", "back", "over-shoulder"]);
    expect(getAutoCameraOrientationUiHint(targetType)).toContain("远景小人物");
    expect(getAutoCameraOrientationUiHint(targetType)).toContain("背影");
    expect(getResolvedCameraOrientationPromptHint(targetType)).toContain("Current preference order");
    expect(getResolvedCameraOrientationPromptHint(targetType)).toContain("distant small figure");
  });
});
