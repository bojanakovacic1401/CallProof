import type { CSSProperties } from "react";

export type AnalysisStage =
  | "idle"
  | "transcribing"
  | "transcribed"
  | "analyzing"
  | "ready"
  | "error";

export type ThemeMode = "dark" | "light";

export type ThemeStyle = CSSProperties & Record<`--${string}`, string>;

export type RiskTone = "safe" | "warning" | "danger";

export type TranscriptionSource = "none" | "ai" | "simulated";