import { describe, expect, it } from "vitest";

import {
  POPULAR_STYLE_TAGS,
  STYLE_TAG_GROUPS,
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

  it("includes popular short-drama tags with prompt hints", () => {
    const shortDramaGroup = STYLE_TAG_GROUPS.find((group) => group.id === "short-drama");
    const shortDramaTags = POPULAR_STYLE_TAGS.filter((tag) => tag.group === "short-drama");

    expect(shortDramaGroup?.label).toBe("短剧热门");
    expect(shortDramaTags.map((tag) => tag.label)).toEqual(
      expect.arrayContaining([
        "豪门霸总",
        "逆袭爽剧",
        "先婚后爱",
        "萌宝团宠",
        "重生复仇",
        "大女主成长",
        "家族权斗",
        "刑侦悬疑",
        "系统脑洞"
      ])
    );
    expect(formatSelectedStyleLabels('["ceo-romance","rebirth-revenge","family-power"]')).toBe(
      "豪门霸总、重生复仇、家族权斗"
    );
    expect(formatSelectedStylePromptHints('["ceo-romance","rebirth-revenge","family-power"]')).toContain(
      "vertical short drama"
    );
    expect(formatSelectedStylePromptHints('["ceo-romance","rebirth-revenge","family-power"]')).toContain(
      "revenge comeback"
    );
  });

  it("uses character-led auto camera guidance for relationship short-drama tags", () => {
    const targetType = '{"styleTags":["ceo-romance","contract-marriage"],"cameraOrientation":"auto"}';

    expect(getAutoCameraOrientationCandidates(targetType)).toEqual(["three-quarter", "over-shoulder", "side"]);
  });

  it("generates dynamic auto camera guidance from style tags", () => {
    const targetType = '{"styleTags":["xianxia","scene-narrative"],"cameraOrientation":"auto"}';

    expect(getAutoCameraOrientationCandidates(targetType)).toEqual(["environment-wide", "low-angle", "overhead"]);
    expect(getAutoCameraOrientationUiHint(targetType)).toContain("环境远景");
    expect(getAutoCameraOrientationUiHint(targetType)).not.toContain("远景小人物");
    expect(getResolvedCameraOrientationPromptHint(targetType)).toContain("Current preference order");
    expect(getResolvedCameraOrientationPromptHint(targetType)).toContain("environment-wide composition");
    expect(getResolvedCameraOrientationPromptHint(targetType)).toContain("environmental scale anchors");
  });
});
