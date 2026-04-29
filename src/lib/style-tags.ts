export type StyleTagGroup = {
  id: string;
  label: string;
};

export type CameraOrientation =
  | "auto"
  | "environment-wide"
  | "low-angle"
  | "overhead"
  | "symmetric"
  | "front"
  | "three-quarter"
  | "side"
  | "back"
  | "over-shoulder"
  | "distant";

export type StyleTagOption = {
  id: string;
  label: string;
  group: StyleTagGroup["id"];
  promptHint: string;
};

export type CameraOrientationOption = {
  value: CameraOrientation;
  label: string;
  promptHint: string;
};

type SelectedTargetPreferences = {
  styleTags: string[];
  cameraOrientation: CameraOrientation;
};

type AutoOrientationRule = {
  orientations: Partial<Record<CameraOrientation, number>>;
  tags: string[];
};

export const DEFAULT_STYLE_TAG_ID = "general";
export const DEFAULT_CAMERA_ORIENTATION: CameraOrientation = "auto";

export const CAMERA_ORIENTATION_OPTIONS: CameraOrientationOption[] = [
  {
    value: "auto",
    label: "auto（AI判断）",
    promptHint:
      "auto-select a subject-led composition from the source prompt instead of defaulting to a character, figure, or frontal hero poster"
  },
  {
    value: "environment-wide",
    label: "环境远景",
    promptHint:
      "favor an environment-wide composition focused on place, scale, atmosphere, and spatial layers without adding characters unless explicitly requested"
  },
  {
    value: "low-angle",
    label: "低机位",
    promptHint:
      "favor a low-angle monumental viewpoint that makes the environment, object, gate, horizon, or boundary feel vast and imposing"
  },
  {
    value: "overhead",
    label: "俯瞰",
    promptHint:
      "favor a high-angle or overhead environmental viewpoint that reveals geography, boundaries, patterns, and scale"
  },
  {
    value: "symmetric",
    label: "中心对称",
    promptHint:
      "favor a centered symmetric composition around the main scene, object, gate, monument, horizon, or spatial boundary"
  },
  {
    value: "front",
    label: "正脸",
    promptHint: "favor a frontal view with clearly readable face and direct subject presence"
  },
  {
    value: "three-quarter",
    label: "3/4侧脸",
    promptHint: "favor a three-quarter view for a cinematic balance between face readability and dimensionality"
  },
  {
    value: "side",
    label: "侧身",
    promptHint: "favor a side profile or side-facing body direction with strong silhouette and motion"
  },
  {
    value: "back",
    label: "背影",
    promptHint: "favor a back view or rear-facing figure when it strengthens scale, longing, mystery, or solitude"
  },
  {
    value: "over-shoulder",
    label: "越肩",
    promptHint: "favor an over-shoulder or partially occluded storytelling angle rather than a straightforward portrait view"
  },
  {
    value: "distant",
    label: "远景小人物",
    promptHint: "favor a distant-figure composition where the character is small relative to the environment"
  }
];

export const STYLE_TAG_GROUPS: StyleTagGroup[] = [
  { id: "short-drama", label: "短剧热门" },
  { id: "genre", label: "题材叙事" },
  { id: "cinematic", label: "镜头与氛围" },
  { id: "anime", label: "动漫与网络热门" },
  { id: "painting", label: "绘画与传统工艺" }
];

export const POPULAR_STYLE_TAGS: StyleTagOption[] = [
  {
    id: "general",
    label: "通用",
    group: "genre",
    promptHint: "general high-quality image generation with no single strong genre bias"
  },
  {
    id: "ceo-romance",
    label: "豪门霸总",
    group: "short-drama",
    promptHint: "vertical short drama billionaire CEO romance, luxury office, mansion interiors, sharp suits, status tension"
  },
  {
    id: "counterattack",
    label: "逆袭爽剧",
    group: "short-drama",
    promptHint: "vertical short drama underdog counterattack, humiliation reversal, triumphant reveal, high-emotion confrontation"
  },
  {
    id: "contract-marriage",
    label: "先婚后爱",
    group: "short-drama",
    promptHint: "contract marriage romance, wedding certificate, restrained intimacy, wealthy family pressure, slow-burn chemistry"
  },
  {
    id: "second-chance-romance",
    label: "破镜重圆",
    group: "short-drama",
    promptHint: "second-chance romance, reunion after separation, restrained longing, rain-night encounter, emotional close-ups"
  },
  {
    id: "cute-baby",
    label: "萌宝团宠",
    group: "short-drama",
    promptHint: "cute baby and family-pampering short drama, warm mansion or home scenes, playful child focus, soft family comedy"
  },
  {
    id: "rebirth-revenge",
    label: "重生复仇",
    group: "short-drama",
    promptHint: "rebirth revenge comeback, cold gaze, elegant retaliation, fate reversal, dramatic before-and-after contrast"
  },
  {
    id: "female-growth",
    label: "大女主成长",
    group: "short-drama",
    promptHint: "strong female lead growth, career rise, self-rescue, polished urban confidence, decisive emotional turning point"
  },
  {
    id: "workplace-marriage",
    label: "职场婚恋",
    group: "short-drama",
    promptHint: "workplace marriage romance, boardroom tension, office glass walls, professional styling, intimate power dynamics"
  },
  {
    id: "family-power",
    label: "家族权斗",
    group: "short-drama",
    promptHint: "vertical short drama family power struggle, banquet hall, inheritance conflict, patriarchal mansion, tense ensemble staging"
  },
  {
    id: "period-warmth",
    label: "年代温情",
    group: "short-drama",
    promptHint: "nostalgic period-life short drama, warm family courtyard, textured old streets, humble clothing, emotional everyday realism"
  },
  {
    id: "republic-intrigue",
    label: "民国权谋",
    group: "short-drama",
    promptHint: "Republic-era intrigue, qipao and suits, smoky mansion, newspaper office, political suspense, vintage Chinese elegance"
  },
  {
    id: "crime-investigation",
    label: "刑侦悬疑",
    group: "short-drama",
    promptHint: "crime investigation suspense, police lights, evidence board, rainy alley, tense procedural mood, sharp clue details"
  },
  {
    id: "legal-elite",
    label: "律政精英",
    group: "short-drama",
    promptHint: "legal elite drama, courtroom confrontation, law office, documents and evidence, crisp suits, rational high-stakes tension"
  },
  {
    id: "war-god-return",
    label: "战神归来",
    group: "short-drama",
    promptHint: "urban war-god return short drama, hidden identity reveal, black coat, guards, night city, intimidating heroic entrance"
  },
  {
    id: "son-in-law-counterattack",
    label: "赘婿逆袭",
    group: "short-drama",
    promptHint: "matrilocal son-in-law counterattack, family humiliation, sudden status reveal, luxury car arrival, satisfying reversal"
  },
  {
    id: "miracle-doctor",
    label: "神医下山",
    group: "short-drama",
    promptHint: "miracle doctor from mountain to city, acupuncture, herbal medicine, hidden master identity, modern clinic confrontation"
  },
  {
    id: "transmigration-rebirth",
    label: "穿越重生",
    group: "short-drama",
    promptHint: "transmigration or rebirth setup, time-shift contrast, ancient-modern collision, destiny rewrite, dramatic awakening"
  },
  {
    id: "system-fantasy",
    label: "系统脑洞",
    group: "short-drama",
    promptHint: "system-powered fantasy premise, translucent UI overlays, mission panels, comedic absurdity, reality-bending shortcut"
  },
  {
    id: "xianxia",
    label: "玄幻修仙",
    group: "genre",
    promptHint: "xianxia fantasy, immortal cultivation, celestial ruins, mythic Chinese elegance"
  },
  {
    id: "chinese-myth",
    label: "国风神话",
    group: "genre",
    promptHint: "Chinese mythic grandeur, divine architecture, ritual atmosphere, legendary beings"
  },
  {
    id: "eastern-weird",
    label: "东方志怪",
    group: "genre",
    promptHint: "eastern strange tales, eerie folklore, ritual mystery, uncanny creatures"
  },
  {
    id: "wuxia",
    label: "武侠江湖",
    group: "genre",
    promptHint: "wuxia heroism, martial grace, rivers and lakes atmosphere, period drama energy"
  },
  {
    id: "dark-epic",
    label: "黑暗史诗",
    group: "genre",
    promptHint: "dark epic fantasy, solemn scale, tragic grandeur, oppressive atmosphere"
  },
  {
    id: "fantasy-adventure",
    label: "奇幻冒险",
    group: "genre",
    promptHint: "fantasy adventure, discovery, wonder, layered environments, heroic momentum"
  },
  {
    id: "cyberpunk",
    label: "赛博朋克",
    group: "genre",
    promptHint: "cyberpunk neon, rain-soaked city, high-tech low-life, luminous signage"
  },
  {
    id: "post-apocalypse",
    label: "末日废土",
    group: "genre",
    promptHint: "post-apocalyptic wasteland, ruined civilization, survival tension, harsh atmosphere"
  },
  {
    id: "suspense-horror",
    label: "悬疑惊悚",
    group: "genre",
    promptHint: "suspenseful horror mood, unsettling tension, psychological unease, restrained dread"
  },
  {
    id: "campus-youth",
    label: "校园青春",
    group: "genre",
    promptHint: "youthful campus vibe, bright emotion, slice-of-life freshness, youthful chemistry"
  },
  {
    id: "urban-romance",
    label: "都市言情",
    group: "genre",
    promptHint: "modern urban romance, polished fashion, emotional intimacy, contemporary elegance"
  },
  {
    id: "ancient-romance",
    label: "古偶言情",
    group: "genre",
    promptHint: "historical romance drama, graceful costume layers, poetic longing, elegant intimacy"
  },
  {
    id: "cute-romance",
    label: "可爱言情",
    group: "genre",
    promptHint: "cute romantic storytelling, sweet chemistry, soft expressions, charming mood"
  },
  {
    id: "dream-fairytale",
    label: "梦幻童话",
    group: "genre",
    promptHint: "dreamy fairytale wonder, magical softness, luminous fantasy, whimsical charm"
  },
  {
    id: "healing-daily",
    label: "治愈日常",
    group: "genre",
    promptHint: "healing everyday warmth, calm storytelling, cozy atmosphere, gentle emotional tone"
  },
  {
    id: "cinematic-still",
    label: "写实电影感",
    group: "cinematic",
    promptHint: "cinematic still, deliberate framing, dramatic light, grounded realism"
  },
  {
    id: "scene-narrative",
    label: "场景叙事",
    group: "cinematic",
    promptHint: "environmental storytelling, strong scale anchors, spatial drama, layered composition"
  },
  {
    id: "character-poster",
    label: "角色海报",
    group: "cinematic",
    promptHint: "character-focused poster composition, iconic silhouette, polished presentation"
  },
  {
    id: "soft-romance-light",
    label: "柔光恋爱",
    group: "cinematic",
    promptHint: "soft romantic light, tender intimacy, flattering skin tones, gentle atmosphere"
  },
  {
    id: "dreamy-surreal",
    label: "梦核超现实",
    group: "cinematic",
    promptHint: "dreamlike surrealism, poetic unreality, impossible space, subconscious imagery"
  },
  {
    id: "silhouette-shadow",
    label: "剪影光影",
    group: "cinematic",
    promptHint: "silhouette-driven composition, bold shadow shapes, dramatic negative space"
  },
  {
    id: "minimal-line-art",
    label: "极简线稿",
    group: "cinematic",
    promptHint: "minimal line art, restrained detail, elegant negative space, clean design"
  },
  {
    id: "mixed-media-collage",
    label: "混合拼贴",
    group: "cinematic",
    promptHint: "mixed-media collage, layered textures, editorial energy, tactile composition"
  },
  {
    id: "playful-3d",
    label: "潮玩3D",
    group: "cinematic",
    promptHint: "playful 3D illustration, toy-like forms, approachable volume, glossy charm"
  },
  {
    id: "retro-futurism",
    label: "复古未来",
    group: "cinematic",
    promptHint: "retro-futurism, vintage optimism, bold geometry, nostalgic future aesthetics"
  },
  {
    id: "vhs-glitch",
    label: "VHS故障复古",
    group: "cinematic",
    promptHint: "analog VHS glitch, scanlines, tape wear, retro screen artifacts, nostalgic decay"
  },
  {
    id: "textured-handdrawn",
    label: "手绘纹理",
    group: "cinematic",
    promptHint: "hand-drawn texture, visible grain, tactile finish, less sterile digital polish"
  },
  {
    id: "cozy-pastel",
    label: "温柔粉彩",
    group: "cinematic",
    promptHint: "cozy pastel atmosphere, soft gradients, dreamy warmth, calm romance"
  },
  {
    id: "anime-clean",
    label: "日漫清透",
    group: "anime",
    promptHint: "clean anime illustration, crisp linework, expressive faces, modern anime polish"
  },
  {
    id: "shoujo-manga",
    label: "少女漫插画",
    group: "anime",
    promptHint: "shoujo manga romance, elegant poses, emotional eyes, airy sweetness"
  },
  {
    id: "chibi",
    label: "Q版chibi",
    group: "anime",
    promptHint: "chibi proportions, adorable exaggeration, playful expression, compact cuteness"
  },
  {
    id: "pastel-kawaii",
    label: "粉彩kawaii",
    group: "anime",
    promptHint: "pastel kawaii, candy colors, dreamy softness, cute whimsical energy"
  },
  {
    id: "healing-animation",
    label: "治愈手绘动画",
    group: "anime",
    promptHint: "soft hand-painted animation look, warm storytelling, whimsical tenderness"
  },
  {
    id: "action-figure",
    label: "手办盒装",
    group: "anime",
    promptHint: "collectible action figure presentation, toy packaging, character accessories, playful product-shot styling"
  },
  {
    id: "anime-avatar",
    label: "动漫头像",
    group: "anime",
    promptHint: "stylized anime avatar, profile-picture clarity, simplified composition, appealing character focus"
  },
  {
    id: "pop-art-portrait",
    label: "波普肖像",
    group: "anime",
    promptHint: "pop-art portrait, bold graphic color blocks, high contrast, energetic stylization"
  },
  {
    id: "ink-wash",
    label: "水墨国风",
    group: "painting",
    promptHint: "ink wash aesthetic, fluid brushwork, poetic emptiness, Chinese painterly atmosphere"
  },
  {
    id: "ukiyo-e",
    label: "浮世绘木刻",
    group: "painting",
    promptHint: "ukiyo-e woodblock influence, flat pattern rhythm, elegant contour, classic Japanese print energy"
  },
  {
    id: "watercolor-storybook",
    label: "水彩绘本",
    group: "painting",
    promptHint: "watercolor storybook illustration, translucent edges, gentle pigment bloom, tender warmth"
  },
  {
    id: "oil-painting",
    label: "油画厚涂",
    group: "painting",
    promptHint: "rich oil-painting texture, painterly strokes, depth, luxurious color massing"
  },
  {
    id: "art-deco",
    label: "Art Deco华丽复古",
    group: "painting",
    promptHint: "art deco revival, stepped geometry, metallic elegance, luxurious vintage glamour"
  }
];

const STYLE_TAG_MAP = new Map(POPULAR_STYLE_TAGS.map((tag) => [tag.id, tag] as const));
const CAMERA_ORIENTATION_MAP = new Map(CAMERA_ORIENTATION_OPTIONS.map((option) => [option.value, option] as const));
const CAMERA_ORIENTATION_ENGLISH_LABELS: Record<CameraOrientation, string> = {
  auto: "auto",
  "environment-wide": "environment-wide composition",
  "low-angle": "low-angle monumental viewpoint",
  overhead: "overhead environmental viewpoint",
  symmetric: "centered symmetric composition",
  front: "frontal view",
  "three-quarter": "three-quarter view",
  side: "side view",
  back: "back view",
  "over-shoulder": "over-shoulder view",
  distant: "distant small figure"
};

const AUTO_ORIENTATION_RULES: AutoOrientationRule[] = [
  {
    tags: ["scene-narrative", "xianxia", "chinese-myth", "dark-epic", "fantasy-adventure", "post-apocalypse"],
    orientations: { "environment-wide": 5, "low-angle": 4, overhead: 3, symmetric: 2 }
  },
  {
    tags: [
      "cute-romance",
      "urban-romance",
      "ancient-romance",
      "campus-youth",
      "soft-romance-light",
      "shoujo-manga",
      "healing-daily",
      "dream-fairytale",
      "ceo-romance",
      "contract-marriage",
      "second-chance-romance",
      "cute-baby",
      "workplace-marriage",
      "legal-elite"
    ],
    orientations: { "three-quarter": 5, "over-shoulder": 4, side: 2, front: 1 }
  },
  {
    tags: ["character-poster", "anime-avatar", "pop-art-portrait", "action-figure", "playful-3d"],
    orientations: { front: 5, "three-quarter": 4, side: 1 }
  },
  {
    tags: ["eastern-weird", "suspense-horror", "dreamy-surreal", "silhouette-shadow", "vhs-glitch", "crime-investigation"],
    orientations: { "low-angle": 4, symmetric: 3, "environment-wide": 3, overhead: 1 }
  },
  {
    tags: ["wuxia", "cyberpunk", "retro-futurism", "counterattack", "rebirth-revenge", "female-growth", "war-god-return", "son-in-law-counterattack", "miracle-doctor"],
    orientations: { side: 4, "three-quarter": 3, back: 2 }
  },
  {
    tags: ["family-power", "period-warmth", "republic-intrigue", "transmigration-rebirth", "system-fantasy"],
    orientations: { "environment-wide": 3, symmetric: 3, "three-quarter": 2, "low-angle": 2 }
  },
  {
    tags: ["anime-clean", "pastel-kawaii", "chibi", "cozy-pastel", "healing-animation"],
    orientations: { "three-quarter": 4, front: 3, side: 1 }
  },
  {
    tags: ["ink-wash", "ukiyo-e", "minimal-line-art", "mixed-media-collage", "textured-handdrawn", "watercolor-storybook", "oil-painting"],
    orientations: { "environment-wide": 3, symmetric: 3, overhead: 2, "low-angle": 1 }
  }
];

const CAMERA_ORIENTATION_SORT_ORDER: CameraOrientation[] = [
  "environment-wide",
  "low-angle",
  "overhead",
  "symmetric",
  "distant",
  "back",
  "over-shoulder",
  "three-quarter",
  "side",
  "front"
];

function dedupeStyleTags(tags: string[]) {
  return Array.from(
    new Set(
      tags
        .map((tag) => tag.trim())
        .filter(Boolean)
    )
  );
}

function isCameraOrientation(value: unknown): value is CameraOrientation {
  return typeof value === "string" && CAMERA_ORIENTATION_MAP.has(value as CameraOrientation);
}

function scoreAutoCameraOrientations(styleTags: string[]) {
  const scores = new Map<CameraOrientation, number>(
    CAMERA_ORIENTATION_OPTIONS
      .filter((option) => option.value !== "auto")
      .map((option) => [option.value, 0] as [CameraOrientation, number])
  );
  const tagSet = new Set(styleTags);

  for (const rule of AUTO_ORIENTATION_RULES) {
    const matchedCount = rule.tags.filter((tag) => tagSet.has(tag)).length;

    if (matchedCount === 0) {
      continue;
    }

    for (const [orientation, score] of Object.entries(rule.orientations) as Array<[CameraOrientation, number]>) {
      scores.set(orientation, (scores.get(orientation) ?? 0) + score * matchedCount);
    }
  }

  if (Array.from(scores.values()).every((score) => score === 0)) {
    scores.set("environment-wide", 2);
    scores.set("symmetric", 1);
    scores.set("low-angle", 1);
  }

  return scores;
}

function sortCameraOrientationsByScore(scores: Map<CameraOrientation, number>) {
  return CAMERA_ORIENTATION_SORT_ORDER.slice().sort((left, right) => {
    const scoreDelta = (scores.get(right) ?? 0) - (scores.get(left) ?? 0);

    if (scoreDelta !== 0) {
      return scoreDelta;
    }

    return CAMERA_ORIENTATION_SORT_ORDER.indexOf(left) - CAMERA_ORIENTATION_SORT_ORDER.indexOf(right);
  });
}

export function getAutoCameraOrientationCandidates(value: string | null | undefined) {
  const styleTags = parseSelectedStyleTags(value);
  const scores = scoreAutoCameraOrientations(styleTags);

  return sortCameraOrientationsByScore(scores).slice(0, 3);
}

export function parseSelectedTargetPreferences(value: string | null | undefined): SelectedTargetPreferences {
  if (!value || !value.trim()) {
    return {
      styleTags: [DEFAULT_STYLE_TAG_ID],
      cameraOrientation: DEFAULT_CAMERA_ORIENTATION
    };
  }

  const trimmed = value.trim();

  try {
    const parsed = JSON.parse(trimmed) as unknown;

    if (Array.isArray(parsed)) {
      const tags = dedupeStyleTags(parsed.filter((item): item is string => typeof item === "string"));
      return {
        styleTags: tags.length > 0 ? tags : [DEFAULT_STYLE_TAG_ID],
        cameraOrientation: DEFAULT_CAMERA_ORIENTATION
      };
    }

    if (parsed && typeof parsed === "object") {
      const record = parsed as {
        styleTags?: unknown;
        tags?: unknown;
        cameraOrientation?: unknown;
      };
      const rawTags = Array.isArray(record.styleTags)
        ? record.styleTags
        : Array.isArray(record.tags)
          ? record.tags
          : [];
      const tags = dedupeStyleTags(rawTags.filter((item): item is string => typeof item === "string"));

      return {
        styleTags: tags.length > 0 ? tags : [DEFAULT_STYLE_TAG_ID],
        cameraOrientation: isCameraOrientation(record.cameraOrientation)
          ? record.cameraOrientation
          : DEFAULT_CAMERA_ORIENTATION
      };
    }
  } catch {
    // Fall through to legacy parsing.
  }

  if (trimmed.includes(",")) {
    const tags = dedupeStyleTags(trimmed.split(","));
    return {
      styleTags: tags.length > 0 ? tags : [DEFAULT_STYLE_TAG_ID],
      cameraOrientation: DEFAULT_CAMERA_ORIENTATION
    };
  }

  return {
    styleTags: [trimmed],
    cameraOrientation: DEFAULT_CAMERA_ORIENTATION
  };
}

export function parseSelectedStyleTags(value: string | null | undefined): string[] {
  return parseSelectedTargetPreferences(value).styleTags;
}

export function serializeSelectedStyleTags(tags: string[]) {
  return serializeSelectedTargetPreferences({
    styleTags: tags,
    cameraOrientation: DEFAULT_CAMERA_ORIENTATION
  });
}

export function serializeSelectedTargetPreferences(preferences: Partial<SelectedTargetPreferences>) {
  const styleTags = dedupeStyleTags(preferences.styleTags ?? []);
  const cameraOrientation = preferences.cameraOrientation ?? DEFAULT_CAMERA_ORIENTATION;

  return JSON.stringify({
    styleTags: styleTags.length > 0 ? styleTags : [DEFAULT_STYLE_TAG_ID],
    cameraOrientation: isCameraOrientation(cameraOrientation) ? cameraOrientation : DEFAULT_CAMERA_ORIENTATION
  });
}

export function getStyleTagLabel(tagId: string) {
  return STYLE_TAG_MAP.get(tagId)?.label ?? tagId;
}

export function formatSelectedStyleLabels(value: string | null | undefined) {
  return parseSelectedStyleTags(value)
    .map(getStyleTagLabel)
    .join("、");
}

export function formatSelectedStylePromptHints(value: string | null | undefined) {
  return parseSelectedStyleTags(value)
    .map((tagId) => STYLE_TAG_MAP.get(tagId)?.promptHint ?? tagId)
    .join("; ");
}

export function getSelectedCameraOrientation(value: string | null | undefined) {
  return parseSelectedTargetPreferences(value).cameraOrientation;
}

export function getCameraOrientationLabel(orientation: CameraOrientation) {
  return CAMERA_ORIENTATION_MAP.get(orientation)?.label ?? orientation;
}

export function getCameraOrientationPromptHint(orientation: CameraOrientation) {
  return (
    CAMERA_ORIENTATION_MAP.get(orientation)?.promptHint ??
    CAMERA_ORIENTATION_MAP.get(DEFAULT_CAMERA_ORIENTATION)?.promptHint ??
    "auto-select the most effective subject orientation for the scene"
  );
}

export function getResolvedCameraOrientationLabel(value: string | null | undefined) {
  const selectedOrientation = getSelectedCameraOrientation(value);

  if (selectedOrientation !== "auto") {
    return getCameraOrientationLabel(selectedOrientation);
  }

  const candidates = getAutoCameraOrientationCandidates(value).map((orientation) => getCameraOrientationLabel(orientation));
  return `auto（AI判断，当前倾向：${candidates.join(" / ")}）`;
}

export function getResolvedCameraOrientationPromptHint(value: string | null | undefined) {
  const selectedOrientation = getSelectedCameraOrientation(value);

  if (selectedOrientation !== "auto") {
    return getCameraOrientationPromptHint(selectedOrientation);
  }

  const [first, second, third] = getAutoCameraOrientationCandidates(value);
  const preferredOrientations = [first, second, third]
    .filter((orientation): orientation is CameraOrientation => Boolean(orientation))
    .map((orientation) => CAMERA_ORIENTATION_ENGLISH_LABELS[orientation]);

  return [
    "auto mode: choose a subject-led composition for the dramatic beat instead of defaulting to a character, figure, or frontal hero poster.",
    `Current preference order based on the selected style tags: ${preferredOrientations.join(", ")}.`,
    "Preserve the source prompt's main subject; when no person or creature is explicit, use environmental scale anchors instead of adding a distant figure, traveler, silhouette, portrait, or body."
  ].join(" ");
}

export function getAutoCameraOrientationUiHint(value: string | null | undefined) {
  const candidates = getAutoCameraOrientationCandidates(value).map((orientation) => getCameraOrientationLabel(orientation));
  return `当前 auto 倾向：${candidates.join(" / ")}`;
}

export function updateSelectedTargetCameraOrientation(
  value: string | null | undefined,
  cameraOrientation: CameraOrientation
) {
  const preferences = parseSelectedTargetPreferences(value);

  return serializeSelectedTargetPreferences({
    styleTags: preferences.styleTags,
    cameraOrientation
  });
}

export function updateSelectedTargetStyleTags(
  value: string | null | undefined,
  styleTags: string[]
) {
  const preferences = parseSelectedTargetPreferences(value);

  return serializeSelectedTargetPreferences({
    styleTags,
    cameraOrientation: preferences.cameraOrientation
  });
}

export function isKnownStyleTag(tagId: string) {
  return STYLE_TAG_MAP.has(tagId);
}
