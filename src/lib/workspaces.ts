import { db } from "@/lib/db";

export function createEmptyWorkspace(title: string) {
  return {
    title,
    mode: "optimize",
    outputLanguage: "zh",
    selectedTargetType: "general",
    sourcePrompt: "",
    questionMessages: [],
    answers: [],
    status: "idle"
  };
}

export async function listWorkspaces() {
  return db.workspace.findMany({ orderBy: { createdAt: "asc" } });
}

export async function createWorkspace(title: string) {
  return db.workspace.create({
    data: {
      title,
      mode: "OPTIMIZE",
      outputLanguage: "ZH",
      selectedTargetType: "general"
    }
  });
}
