"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import {
  AudioLines,
  BellRing,
  FileText,
  Radar,
  ShieldCheck,
  Siren,
  Users,
  Zap,
} from "lucide-react";

import {
  defaultDemoCase,
  simulatedAudioTranscript,
} from "@/lib/demoCases";
import { analyzeScamContent } from "@/lib/scamEngine";
import type {
  DemoCase,
  InputMode,
  ScamAnalysis,
  ScanHistoryItem,
} from "@/lib/types";

import { AnalyzerPanel } from "@/components/AnalyzerPanel";
import {
  DemoCasesPanel,
  EducationPanel,
  EvidencePanel,
  HistoryPanel,
  MetricCard,
  NextStepsPanel,
  ProtectionLevelCard,
  RecentAlertsPanel,
  RiskScoreCard,
  SafeReplyPanel,
  SignalPanel,
} from "@/components/DashboardPanels";
import { LatestAnalysisPanel } from "@/components/LatestAnalysisPanel";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import type {
  AnalysisStage,
  ThemeMode,
  ThemeStyle,
  TranscriptionSource,
} from "@/components/types";

type AnalyzeApiResponse =
  | {
      ok: true;
      analysis: ScamAnalysis;
      aiEnabled: boolean;
      fallbackAnalysis: ScamAnalysis;
      timestamp: string;
      durationMs: number;
    }
  | {
      ok: false;
      error: string;
    };

type TranscribeApiResponse =
  | {
      ok: true;
      transcript: string;
      model: string;
      fileName: string;
      fileSize: number;
      timestamp: string;
    }
  | {
      ok: false;
      error: string;
      details?: string;
    };

function getThemeStyle(theme: ThemeMode): ThemeStyle {
  if (theme === "light") {
    return {
      "--bg": "#eef5fb",
      "--panel": "rgba(255,255,255,0.94)",
      "--panel-strong": "rgba(255,255,255,0.98)",
      "--sidebar": "rgba(246,251,255,0.98)",
      "--input": "rgba(255,255,255,0.98)",
      "--fg": "#07111f",
      "--muted": "rgba(15,23,42,0.72)",
      "--muted2": "rgba(15,23,42,0.52)",
      "--line": "rgba(15,23,42,0.16)",
      "--cyan": "#0284c7",
      "--red": "#dc2626",
      "--green": "#059669",
      "--shadow": "rgba(15,23,42,0.13)",
      "--grid": "rgba(2,132,199,0.08)",
    };
  }

  return {
    "--bg": "#050914",
    "--panel": "rgba(9,15,30,0.86)",
    "--panel-strong": "rgba(12,19,36,0.95)",
    "--sidebar": "rgba(3,8,20,0.94)",
    "--input": "rgba(2,6,23,0.62)",
    "--fg": "#f8fafc",
    "--muted": "rgba(255,255,255,0.58)",
    "--muted2": "rgba(255,255,255,0.34)",
    "--line": "rgba(255,255,255,0.1)",
    "--cyan": "#22d3ee",
    "--red": "#fb2c55",
    "--green": "#22c55e",
    "--shadow": "rgba(0,0,0,0.28)",
    "--grid": "rgba(34,211,238,0.052)",
  };
}

function createHistoryItem({
  mode,
  analysis,
}: {
  mode: InputMode;
  analysis: ScamAnalysis;
}): ScanHistoryItem {
  return {
    id: `${Date.now()}-${Math.random()}`,
    createdAt: new Date().toISOString(),
    mode,
    score: analysis.scamProbability,
    riskLevel: analysis.riskLevel,
    attackType: analysis.attackType,
  };
}

function downloadReport({
  input,
  mode,
  analysis,
  aiEnabled,
}: {
  input: string;
  mode: InputMode;
  analysis: ScamAnalysis;
  aiEnabled: boolean;
}) {
  const report = `CallProof Safety Report

Mode: ${mode}
Analysis source: ${aiEnabled ? "AI semantic review + risk engine" : "Rule-based fallback"}
Scam probability: ${analysis.scamProbability}%
Risk level: ${analysis.riskLevel}
Confidence: ${analysis.confidence}
Attack type: ${analysis.attackType}

Summary:
${analysis.summary}

Red flags:
${analysis.redFlags.map((flag) => `- ${flag}`).join("\n") || "- None"}

Manipulation tactics:
${analysis.tactics.map((tactic) => `- ${tactic}`).join("\n") || "- None"}

Evidence:
${
  analysis.evidence
    .map((item) => `- "${item.text}" — ${item.reason}`)
    .join("\n") || "- None"
}

Safe reply:
${analysis.safeReply}

Next steps:
${analysis.nextSteps.map((step) => `- ${step}`).join("\n")}

Original content:
${input}
`;

  const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `callproof-report-${Date.now()}.txt`;
  link.click();

  URL.revokeObjectURL(url);
}

export default function Home() {
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [mode, setMode] = useState<InputMode>(defaultDemoCase.mode);
  const [input, setInput] = useState(defaultDemoCase.content);
  const [selectedDemoId, setSelectedDemoId] = useState(defaultDemoCase.id);
  const [familyMode, setFamilyMode] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [analysisStage, setAnalysisStage] = useState<AnalysisStage>("idle");
  const [transcriptionSource, setTranscriptionSource] =
    useState<TranscriptionSource>("none");
  const [transcriptionModel, setTranscriptionModel] = useState<string | null>(
    null
  );

  const localAnalysis = useMemo(
    () => analyzeScamContent({ content: input, mode, familyMode }),
    [input, mode, familyMode]
  );

  const [serverAnalysis, setServerAnalysis] = useState<ScamAnalysis | null>(
    null
  );
  const [aiEnabled, setAiEnabled] = useState(false);
  const [apiStatus, setApiStatus] = useState<
    "idle" | "ai" | "fallback" | "error"
  >("idle");

  const analysis = serverAnalysis || localAnalysis;

  useEffect(() => {
    const saved = window.localStorage.getItem("callproof-history");

    if (!saved) return;

    try {
      setHistory(JSON.parse(saved).slice(0, 8));
    } catch {
      window.localStorage.removeItem("callproof-history");
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("callproof-history", JSON.stringify(history));
  }, [history]);

  function resetServerResult() {
    setServerAnalysis(null);
    setAiEnabled(false);
    setApiStatus("idle");
    setHasAnalyzed(false);
    setAnalysisStage("idle");
  }

  function loadDemo(demo: DemoCase) {
    setSelectedDemoId(demo.id);
    setMode(demo.mode);
    setInput(demo.content);
    setAudioFileName(null);
    setTranscriptionSource("none");
    setTranscriptionModel(null);
    resetServerResult();
  }

  async function handleAudioUpload(file: File | null) {
    if (!file) return;

    setMode("audio");
    setAudioFileName(file.name);
    setSelectedDemoId("custom-audio");
    setServerAnalysis(null);
    setAiEnabled(false);
    setApiStatus("idle");
    setHasAnalyzed(false);
    setTranscriptionSource("none");
    setTranscriptionModel(null);
    setAnalysisStage("transcribing");

    try {
      const formData = new FormData();
      formData.append("audio", file);

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as TranscribeApiResponse;

      if (!response.ok || !data.ok) {
        throw new Error("Transcription failed");
      }

      setInput(data.transcript);
      setTranscriptionSource("ai");
      setTranscriptionModel(data.model);
      setAnalysisStage("transcribed");
    } catch {
      setInput(simulatedAudioTranscript);
      setTranscriptionSource("simulated");
      setTranscriptionModel(null);
      setAnalysisStage("error");
    }
  }

  async function runAnalysis() {
    if (!input.trim()) return;

    setIsAnalyzing(true);
    setApiStatus("idle");
    setAnalysisStage("analyzing");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: input,
          mode,
          familyMode,
        }),
      });

      const data = (await response.json()) as AnalyzeApiResponse;

      if (!response.ok || !data.ok) {
        throw new Error("Analysis failed");
      }

      setServerAnalysis(data.analysis);
      setAiEnabled(data.aiEnabled);
      setApiStatus(data.aiEnabled ? "ai" : "fallback");
      setHasAnalyzed(true);
      setAnalysisStage("ready");

      setHistory((prev) =>
        [createHistoryItem({ mode, analysis: data.analysis }), ...prev].slice(
          0,
          8
        )
      );
    } catch {
      setServerAnalysis(localAnalysis);
      setAiEnabled(false);
      setApiStatus("error");
      setHasAnalyzed(true);
      setAnalysisStage("error");

      setHistory((prev) =>
        [createHistoryItem({ mode, analysis: localAnalysis }), ...prev].slice(
          0,
          8
        )
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  const exportCurrentReport = () =>
    downloadReport({ input, mode, analysis, aiEnabled });

  return (
    <main
      style={getThemeStyle(theme) as CSSProperties}
      className="relative min-h-screen overflow-x-hidden bg-[var(--bg)] text-[var(--fg)]"
    >
      <BackgroundEffects />

      <div className="relative z-10 flex min-h-screen">
        <Sidebar />

        <section className="flex min-w-0 flex-1 flex-col">
          <TopBar theme={theme} setTheme={setTheme} />

          <div className="w-full max-w-none px-4 py-5 sm:px-5 lg:px-6">
            <div id="dashboard" className="mb-4 scroll-mt-24">
              <p className="text-xs font-medium uppercase tracking-[0.42em] text-cyan-300">
                Protection overview
              </p>
              <h1 className="mt-1 text-[26px] font-semibold tracking-tight text-[var(--fg)]">
                Your scam defense dashboard
              </h1>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Real-time detection for suspicious calls, messages, audio, and
                social engineering.
              </p>
            </div>

            <div className="mb-5 grid gap-4 xl:grid-cols-[1.05fr_0.95fr_0.95fr_1.05fr]">
              <RiskScoreCard analysis={analysis} />

              <MetricCard
                title="Threats Blocked"
                value={String(
                  history.filter((item) => item.score >= 65).length || 1247
                )}
                detail="+18 this week"
                tone="red"
                chart="bars"
              />

              <div id="contacts" className="h-full scroll-mt-24">
                <MetricCard
                  title="Verified Contacts"
                  value="156"
                  detail="Trusted & verified contacts"
                  tone="cyan"
                  chart="none"
                />
              </div>

              <ProtectionLevelCard />
            </div>

            <div
              id="scanner"
              className="mb-5 grid scroll-mt-24 items-stretch gap-4 xl:grid-cols-[1.1fr_0.8fr_1.1fr]"
            >
              <AnalyzerPanel
                mode={mode}
                setMode={(nextMode) => {
                  setMode(nextMode);
                  resetServerResult();
                }}
                input={input}
                setInput={(value) => {
                  setInput(value);
                  resetServerResult();
                }}
                familyMode={familyMode}
                setFamilyMode={(value) => {
                  setFamilyMode(value);
                  resetServerResult();
                }}
                isAnalyzing={isAnalyzing}
                analysisStage={analysisStage}
                transcriptionSource={transcriptionSource}
                transcriptionModel={transcriptionModel}
                onAnalyze={runAnalysis}
                onAudioUpload={handleAudioUpload}
                audioFileName={audioFileName}
              />

              <section id="alerts" className="h-full scroll-mt-24">
                <RecentAlertsPanel />
              </section>

              <LatestAnalysisPanel
                analysis={analysis}
                isAnalyzing={isAnalyzing}
                aiEnabled={aiEnabled}
                apiStatus={apiStatus}
                onExport={exportCurrentReport}
              />
            </div>

            <div className="mb-5 grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
              <DemoCasesPanel
                selectedDemoId={selectedDemoId}
                onLoadDemo={loadDemo}
              />

              <div className="grid gap-4 lg:grid-cols-3">
                <SignalPanel
                  title="Key Red Flags"
                  icon={<Siren className="h-4 w-4 text-red-300" />}
                  items={analysis.redFlags}
                  empty="No strong red flags detected."
                  tone="red"
                />

                <SignalPanel
                  title="Tactics Detected"
                  icon={<BellRing className="h-4 w-4 text-amber-300" />}
                  items={analysis.tactics}
                  empty="No manipulation tactics detected."
                  tone="amber"
                />

                <SafeReplyPanel
                  analysis={analysis}
                  familyMode={familyMode}
                  hasAnalyzed={hasAnalyzed}
                />
              </div>
            </div>

            <div
              id="reports"
              className="mb-5 grid scroll-mt-24 gap-4 xl:grid-cols-[1fr_1fr]"
            >
              <EvidencePanel analysis={analysis} />
              <NextStepsPanel
                analysis={analysis}
                input={input}
                mode={mode}
                aiEnabled={aiEnabled}
                onExport={exportCurrentReport}
              />
            </div>

            <div
              id="history"
              className="grid scroll-mt-24 gap-4 xl:grid-cols-[0.85fr_1.15fr]"
            >
              <HistoryPanel history={history} onClear={() => setHistory([])} />

              <section id="education" className="scroll-mt-24">
                <EducationPanel />
              </section>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function BackgroundEffects() {
  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_10%,rgba(34,211,238,0.2),transparent_28%),radial-gradient(circle_at_86%_18%,rgba(239,68,68,0.24),transparent_30%),radial-gradient(circle_at_55%_100%,rgba(16,185,129,0.1),transparent_35%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(var(--grid)_1px,transparent_1px),linear-gradient(90deg,var(--grid)_1px,transparent_1px)] bg-[size:42px_42px]" />
      <div className="pointer-events-none absolute right-0 top-24 h-[440px] w-[440px] bg-[radial-gradient(rgba(34,211,238,0.46)_1px,transparent_1px)] bg-[size:8px_8px] opacity-45 [mask-image:radial-gradient(circle,black,transparent_70%)]" />
      <div className="pointer-events-none absolute right-0 top-0 h-full w-[35%] bg-[linear-gradient(90deg,transparent,rgba(239,68,68,0.08))]" />
    </>
  );
}