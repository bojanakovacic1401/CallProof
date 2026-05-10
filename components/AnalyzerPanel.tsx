import type { ReactNode } from "react";
import {
  AudioLines,
  FileAudio,
  MessageSquareText,
  Mic,
  Upload,
  Users,
} from "lucide-react";

import type { InputMode } from "@/lib/types";
import type { AnalysisStage, TranscriptionSource } from "./types";
import { Card } from "./Card";

export function AnalyzerPanel({
  mode,
  setMode,
  input,
  setInput,
  familyMode,
  setFamilyMode,
  isAnalyzing,
  analysisStage,
  transcriptionSource,
  transcriptionModel,
  onAnalyze,
  onAudioUpload,
  audioFileName,
}: {
  mode: InputMode;
  setMode: (mode: InputMode) => void;
  input: string;
  setInput: (value: string) => void;
  familyMode: boolean;
  setFamilyMode: (value: boolean) => void;
  isAnalyzing: boolean;
  analysisStage: AnalysisStage;
  transcriptionSource: TranscriptionSource;
  transcriptionModel: string | null;
  onAnalyze: () => void;
  onAudioUpload: (file: File | null) => void;
  audioFileName: string | null;
}) {
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.34em] text-cyan-300">
            Scan your content
          </p>
          <h2 className="mt-1 text-xl font-semibold text-[var(--fg)]">
            Paste a message, transcript, or upload audio
          </h2>
        </div>

        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-sm font-medium text-amber-200">
          <Users className="h-4 w-4" />
          Family Mode
          <input
            type="checkbox"
            checked={familyMode}
            onChange={(event) => setFamilyMode(event.target.checked)}
            className="accent-amber-300"
          />
        </label>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <ModeButton
          active={mode === "message"}
          icon={<MessageSquareText className="h-4 w-4" />}
          label="Message"
          onClick={() => setMode("message")}
        />
        <ModeButton
          active={mode === "transcript"}
          icon={<Mic className="h-4 w-4" />}
          label="Call Transcript"
          onClick={() => setMode("transcript")}
        />
        <ModeButton
          active={mode === "audio"}
          icon={<AudioLines className="h-4 w-4" />}
          label="Audio File"
          onClick={() => setMode("audio")}
        />
      </div>

      {mode === "audio" && (
        <div className="mb-3 rounded-2xl border border-dashed border-cyan-300/30 bg-cyan-300/10 p-3">
          <label className="flex cursor-pointer items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-300 text-slate-950">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--fg)]">
                  Upload call recording
                </p>
                <p className="text-xs text-[var(--muted)]">
                  Audio is transcribed before analysis.
                </p>
              </div>
            </div>

            <input
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(event) =>
                onAudioUpload(event.target.files?.[0] || null)
              }
            />

            <span className="rounded-xl bg-[var(--fg)] px-3 py-2 text-xs font-medium text-[var(--bg)]">
              Choose
            </span>
          </label>

          {audioFileName && (
            <p className="mt-2 flex items-center gap-2 text-xs text-cyan-300">
              <FileAudio className="h-4 w-4" />
              Uploaded: {audioFileName}
            </p>
          )}
        </div>
      )}

      <textarea
        value={input}
        onChange={(event) => setInput(event.target.value)}
        rows={7}
        className="thin-scrollbar w-full resize-none rounded-2xl border border-[var(--line)] bg-[var(--input)] p-4 font-mono text-sm leading-6 text-[var(--fg)] outline-none transition placeholder:text-[var(--muted2)] focus:border-red-300/50"
        placeholder="Paste a suspicious message here..."
      />

      <LoadingPipeline
        stage={analysisStage}
        transcriptionSource={transcriptionSource}
        transcriptionModel={transcriptionModel}
      />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={onAnalyze}
          disabled={
            isAnalyzing || !input.trim() || analysisStage === "transcribing"
          }
          className="rounded-xl bg-red-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_30px_rgba(239,68,68,0.32)] transition hover:bg-red-400 disabled:opacity-50"
        >
          {isAnalyzing
            ? "Analyzing..."
            : analysisStage === "transcribing"
              ? "Transcribing..."
              : "Analyze Now"}
        </button>

        <button
          onClick={() => setInput("")}
          className="rounded-xl border border-[var(--line)] bg-white/[0.04] px-5 py-3 text-sm font-medium text-[var(--fg)] transition hover:border-red-300/30"
        >
          Clear
        </button>
      </div>
    </Card>
  );
}

function LoadingPipeline({
  stage,
  transcriptionSource,
  transcriptionModel,
}: {
  stage: AnalysisStage;
  transcriptionSource: TranscriptionSource;
  transcriptionModel: string | null;
}) {
  if (stage === "idle") {
    return null;
  }

  const label =
    stage === "transcribing"
      ? "Transcribing audio..."
      : stage === "transcribed"
        ? `Transcribed with ${transcriptionModel || "OpenAI"}`
        : stage === "analyzing"
          ? "Analyzing scam signals..."
          : stage === "ready"
            ? "Report ready"
            : transcriptionSource === "simulated"
              ? "Transcription fallback used"
              : "Analysis fallback used";

  return (
    <div className="mt-3 rounded-2xl border border-[var(--line)] bg-white/[0.04] px-4 py-3">
      <div className="flex items-center gap-3">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            stage === "ready"
              ? "bg-emerald-400"
              : stage === "error"
                ? "bg-amber-400"
                : "bg-cyan-300"
          } shadow-[0_0_16px_currentColor]`}
        />
        <p className="text-sm font-medium text-[var(--fg)]">{label}</p>
      </div>
    </div>
  );
}

function ModeButton({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition ${
        active
          ? "border-red-300/50 bg-red-300/15 text-red-200"
          : "border-[var(--line)] bg-white/[0.04] text-[var(--muted)] hover:border-cyan-300/30 hover:text-[var(--fg)]"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}