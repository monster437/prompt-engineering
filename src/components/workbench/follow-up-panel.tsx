"use client";

import React from "react";
import type { WorkspaceDto } from "@/lib/types";

type FollowUpPanelProps = {
  workspace: WorkspaceDto;
  pendingQuestion: string | null;
  draftAnswer: string;
  isSubmittingAnswer: boolean;
  onDraftAnswerChange: (value: string) => void;
  onSubmitAnswer: () => void;
};

export function FollowUpPanel({
  workspace,
  pendingQuestion,
  draftAnswer,
  isSubmittingAnswer,
  onDraftAnswerChange,
  onSubmitAnswer
}: FollowUpPanelProps) {
  const history = workspace.questionMessages.map((question, index) => ({
    question,
    answer: workspace.answers[index] ?? ""
  }));

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Follow-up</h2>
        <span className="text-xs text-slate-500">{workspace.mode === "interview" ? "Interview mode" : "Optimize mode"}</span>
      </div>

      {history.length === 0 ? (
        <p className="rounded-md border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500">
          No follow-up questions yet.
        </p>
      ) : (
        <div className="space-y-3">
          {history.map((entry, index) => (
            <div key={`${index}-${entry.question}`} className="rounded-lg border border-slate-200 p-3 text-sm">
              <p className="font-medium text-slate-900">Q{index + 1}. {entry.question}</p>
              <p className="mt-2 text-slate-600">A. {entry.answer || "Pending"}</p>
            </div>
          ))}
        </div>
      )}

      {pendingQuestion ? (
        <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div>
            <p className="text-sm font-medium text-slate-900">Current question</p>
            <p className="mt-1 text-sm text-slate-600">{pendingQuestion}</p>
          </div>
          <label className="block space-y-1 text-sm text-slate-700">
            <span className="font-medium">Your answer</span>
            <textarea
              value={draftAnswer}
              onChange={(event) => onDraftAnswerChange(event.target.value)}
              className="min-h-24 w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </label>
          <button
            type="button"
            onClick={onSubmitAnswer}
            disabled={isSubmittingAnswer}
            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSubmittingAnswer ? "Submitting..." : "Submit answer"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
