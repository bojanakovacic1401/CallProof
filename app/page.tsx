"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  AlertTriangle,
  AudioLines,
  BadgeAlert,
  Ban,
  Bell,
  BellRing,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Download,
  FileAudio,
  FileText,
  Fingerprint,
  Globe,
  History,
  LayoutDashboard,
  Lock,
  MessageSquareText,
  Mic,
  Moon,
  Phone,
  Radar,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  Siren,
  Skull,
  Sparkles,
  Sun,
  Upload,
  UserCheck,
  Users,
  Zap,
} from "lucide-react";

import {
  defaultDemoCase,
  demoCases,
  simulatedAudioTranscript,
} from "@/lib/demoCases";
import { analyzeScamContent } from "@/lib/scamEngine";
import type {
  DemoCase,
  InputMode,
  ScamAnalysis,
  ScanHistoryItem,
} from "@/lib/types";

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

type AnalysisStage =
  | "idle"
  | "transcribing"
  | "transcribed"
  | "analyzing"
  | "ready"
  | "error";

type ThemeMode = "dark" | "light";

type ThemeStyle = CSSProperties & Record<`--${string}`, string>;

function getThemeStyle(theme: ThemeMode): ThemeStyle {
  if (theme === "light") {
  return {
    "--bg": "#f3f7fb",
    "--panel": "rgba(255,255,255,0.88)",
    "--panel-strong": "rgba(255,255,255,0.97)",
    "--sidebar": "rgba(248,252,255,0.96)",
    "--input": "rgba(255,255,255,0.94)",
    "--fg": "#07111f",
    "--muted": "rgba(15,23,42,0.68)",
    "--muted2": "rgba(15,23,42,0.48)",
    "--line": "rgba(15,23,42,0.16)",
    "--cyan": "#0284c7",
    "--red": "#dc2626",
    "--green": "#059669",
    "--shadow": "rgba(15,23,42,0.12)",
    "--grid": "rgba(2,132,199,0.09)",
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

function getRiskStyle(risk: string) {
  if (risk === "Critical") return "border-red-400/40 bg-red-500/10 text-red-100";
  if (risk === "High") return "border-orange-400/40 bg-orange-500/10 text-orange-100";
  if (risk === "Medium") return "border-amber-400/40 bg-amber-500/10 text-amber-100";
  return "border-emerald-400/40 bg-emerald-500/10 text-emerald-100";
}

function isDangerRisk(risk: string) {
  return risk === "Critical" || risk === "High";
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
  const [transcriptionSource, setTranscriptionSource] = useState<
    "none" | "ai" | "simulated"
  >("none");
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
  const dangerous = isDangerRisk(analysis.riskLevel);

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

  return (
    <main
      style={getThemeStyle(theme)}
      className="relative min-h-screen overflow-hidden bg-[var(--bg)] text-[var(--fg)]"
    >
      <BackgroundEffects />

      <div className="relative z-10 flex min-h-screen">
        <Sidebar />

        <section className="flex min-w-0 flex-1 flex-col">
          <TopBar theme={theme} setTheme={setTheme} />

          <div className="mx-auto w-full max-w-[1480px] px-5 py-5 lg:px-6">
            <div id="dashboard" className="mb-4 scroll-mt-24">
              <p className="text-xs font-medium uppercase tracking-[0.42em] text-cyan-300">
                Protection overview
              </p>
              <h1 className="mt-1 text-[26px] font-semibold tracking-tight text-[var(--fg)]">
                Your scam defense dashboard
              </h1>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Real-time detection for suspicious calls, messages, audio, and social engineering.
              </p>
            </div>

            <div className="mb-5 grid gap-4 xl:grid-cols-[1.05fr_0.95fr_0.95fr_1.05fr]">
              <RiskScoreCard analysis={analysis} />
              <MetricCard
                title="Threats Blocked"
                value={String(history.filter((item) => item.score >= 65).length || 1_247)}
                detail="+18 this week"
                tone="red"
                chart="bars"
              />
              <div id="contacts" className="scroll-mt-24">
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

<div id="scanner" className="mb-5 grid scroll-mt-24 gap-4 xl:grid-cols-[1.1fr_0.75fr_1.15fr]">
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

              <section id="alerts" className="scroll-mt-24">
                <RecentAlertsPanel />
              </section>

              <LatestAnalysisPanel
                analysis={analysis}
                isAnalyzing={isAnalyzing}
                aiEnabled={aiEnabled}
                apiStatus={apiStatus}
                dangerous={dangerous}
                onExport={() =>
                  downloadReport({ input, mode, analysis, aiEnabled })
                }
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

            <div id="reports" className="mb-5 grid scroll-mt-24 gap-4 xl:grid-cols-[1fr_1fr]">
              <EvidencePanel analysis={analysis} />
              <NextStepsPanel
                analysis={analysis}
                input={input}
                mode={mode}
                aiEnabled={aiEnabled}
              />
            </div>

            <div id="history" className="grid scroll-mt-24 gap-4 xl:grid-cols-[0.85fr_1.15fr]">
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

function Card({
  children,
  className = "",
  danger = false,
}: {
  children: ReactNode;
  className?: string;
  danger?: boolean;
}) {
  return (
    <section
      className={`rounded-[18px] border p-4 shadow-[0_18px_60px_var(--shadow)] backdrop-blur-xl ${
        danger
          ? "border-red-400/30 bg-[linear-gradient(135deg,rgba(127,29,29,0.72),var(--panel)),radial-gradient(circle_at_84%_25%,rgba(239,68,68,0.3),transparent_34%)]"
          : "border-[var(--line)] bg-[linear-gradient(135deg,var(--panel-strong),var(--panel)),radial-gradient(circle_at_top_right,rgba(34,211,238,0.055),transparent_34%)]"
      } ${className}`}
    >
      {children}
    </section>
  );
}

function LogoMark() {
  return (
    <div className="relative flex h-11 w-11 items-center justify-center rounded-[14px] border border-red-400/35 bg-red-500/10 text-red-300 shadow-[0_0_28px_rgba(239,68,68,0.2)]">
      <Shield className="h-6 w-6" />
      <div className="absolute inset-1 rounded-[11px] border border-red-400/10" />
    </div>
  );
}

function Sidebar() {
  const items = [
    {
      label: "Dashboard",
      icon: <LayoutDashboard className="h-4 w-4" />,
      active: true,
      target: "dashboard",
    },
    {
      label: "Alerts",
      icon: <Bell className="h-4 w-4" />,
      badge: "3",
      target: "alerts",
    },
    {
      label: "Call Protection",
      icon: <Phone className="h-4 w-4" />,
      target: "scanner",
    },
    {
      label: "Message Protection",
      icon: <MessageSquareText className="h-4 w-4" />,
      target: "scanner",
    },
    {
      label: "Audio Scanner",
      icon: <AudioLines className="h-4 w-4" />,
      target: "scanner",
    },
    {
      label: "Trusted Contacts",
      icon: <UserCheck className="h-4 w-4" />,
      target: "contacts",
    },
    {
      label: "Reports",
      icon: <FileText className="h-4 w-4" />,
      target: "reports",
    },
    {
      label: "Privacy Center",
      icon: <Lock className="h-4 w-4" />,
      target: "education",
    },
    {
      label: "Settings",
      icon: <Settings className="h-4 w-4" />,
      target: "dashboard",
    },
  ];

  function scrollToSection(target: string) {
    document.getElementById(target)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <aside className="hidden w-[258px] shrink-0 border-r border-[var(--line)] bg-[var(--sidebar)] p-4 backdrop-blur-xl lg:block">
      <div className="mb-7 flex items-center gap-3">
        <LogoMark />

        <div>
          <p className="text-xl font-semibold tracking-tight text-[var(--fg)]">
            CallProof
          </p>
          <p className="text-xs font-medium text-cyan-300">
            Scan Protection
          </p>
        </div>
      </div>

      <nav className="space-y-1.5">
        {items.map((item) => (
          <button
            key={item.label}
            onClick={() => scrollToSection(item.target)}
            className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
              item.active
                ? "bg-red-500/15 text-red-100 shadow-[inset_0_0_0_1px_rgba(248,113,113,0.18)]"
                : "text-[var(--muted)] hover:bg-white/[0.05] hover:text-[var(--fg)]"
            }`}
            type="button"
          >
            {item.icon}
            {item.label}

            {item.badge && (
              <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white shadow-[0_0_20px_rgba(239,68,68,0.35)]">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="mt-8 rounded-2xl border border-cyan-300/15 bg-cyan-300/10 p-4">
        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-300 text-slate-950">
          <ShieldCheck className="h-5 w-5" />
        </div>

        <p className="text-sm font-semibold text-[var(--fg)]">
          Stay one step ahead
        </p>

        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          CallProof checks suspicious calls, messages, and audio before you
          respond.
        </p>

        <button
          type="button"
          onClick={() => scrollToSection("scanner")}
          className="mt-4 w-full rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-2.5 text-sm font-medium text-cyan-200 transition hover:bg-cyan-300/15"
        >
          Protection active
        </button>
      </div>

      <div className="mt-6">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.26em] text-cyan-300">
          Quick stats
        </p>

        <div className="grid grid-cols-3 gap-2 text-center">
          <SidebarMetric value="AI" label="Review" />
          <SidebarMetric value="Local" label="Logs" />
          <SidebarMetric value="Safe" label="Mode" />
        </div>
      </div>
    </aside>
  );
}

function SidebarMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-white/[0.04] p-2.5">
      <p className="text-sm font-semibold text-[var(--fg)]">{value}</p>
      <p className="mt-1 text-[9px] uppercase tracking-[0.14em] text-[var(--muted2)]">
        {label}
      </p>
    </div>
  );
}

function TopBar({
  theme,
  setTheme,
}: {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--sidebar)] px-5 py-3.5 backdrop-blur-xl lg:px-6">
      <div className="mx-auto flex w-full max-w-[1480px] items-center justify-between gap-4">
        <div className="hidden min-w-[390px] items-center gap-3 rounded-xl border border-[var(--line)] bg-white/[0.05] px-4 py-2.5 text-[var(--muted)] md:flex">
          <Search className="h-4 w-4" />
          <span className="text-sm">Search numbers, messages, reports...</span>
          <span className="ml-auto text-xs text-[var(--muted2)]">⌘ K</span>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--line)] bg-white/[0.05] text-[var(--muted)]">
            <Bell className="h-4 w-4" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-400 shadow-[0_0_12px_rgba(239,68,68,0.9)]" />
          </button>

          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex h-10 items-center gap-2 rounded-xl border border-[var(--line)] bg-white/[0.05] px-3 text-sm font-medium text-[var(--fg)]"
          >
            {theme === "dark" ? (
              <>
                <Sun className="h-4 w-4 text-amber-300" />
                Light
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 text-slate-700" />
                Dark
              </>
            )}
          </button>

          <div className="hidden rounded-xl border border-[var(--line)] bg-white/[0.05] px-4 py-2 md:block">
            <p className="text-sm font-medium text-[var(--fg)]">Protected User</p>
            <p className="text-xs text-cyan-300/80">Premium Plan</p>
          </div>
        </div>
      </div>
    </header>
  );
}

function RiskScoreCard({ analysis }: { analysis: ScamAnalysis }) {
  const danger = isDangerRisk(analysis.riskLevel);

  return (
    <Card>
      <p className="text-sm font-medium text-[var(--fg)]">Risk Score</p>

      <div className="mt-3 flex items-center gap-4">
        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full">
          <div className="absolute inset-0 rounded-full border-[8px] border-white/10" />
          <div
            className={`absolute inset-0 rounded-full border-[8px] ${
              danger ? "border-red-500" : "border-cyan-300"
            } border-b-transparent border-l-transparent`}
          />
          <div className="text-center">
            <p className="text-2xl font-semibold text-[var(--fg)]">
              {analysis.scamProbability}
            </p>
            <p className="text-[10px] text-[var(--muted)]">/100</p>
          </div>
        </div>

        <div className="min-w-0">
          <p className={danger ? "text-lg font-semibold text-red-300" : "text-lg font-semibold text-cyan-300"}>
            {analysis.riskLevel} Risk
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {analysis.confidence} confidence
          </p>
          <div className="mt-3 h-9 w-32">
            <MiniLineChart danger={danger} />
          </div>
        </div>
      </div>
    </Card>
  );
}

function MetricCard({
  title,
  value,
  detail,
  tone,
  chart,
}: {
  title: string;
  value: string;
  detail: string;
  tone: "red" | "cyan";
  chart: "bars" | "none";
}) {
  return (
    <Card>
      <p className="text-sm font-medium text-[var(--fg)]">{title}</p>

      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-3xl font-semibold text-[var(--fg)]">{value}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">{detail}</p>
        </div>

        {chart === "bars" ? (
          <MiniBars />
        ) : (
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-2xl ${
              tone === "red" ? "bg-red-400/12 text-red-300" : "bg-cyan-300/12 text-cyan-300"
            }`}
          >
            <Users className="h-8 w-8" />
          </div>
        )}
      </div>
    </Card>
  );
}

function ProtectionLevelCard() {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--fg)]">Protection Level</p>
          <p className="mt-4 text-xl font-semibold text-emerald-300">Maximum</p>
          <p className="mt-1 text-sm text-[var(--muted)]">All systems active</p>
        </div>

        <div className="relative flex h-20 w-20 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-emerald-400/10 blur-xl" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-300/30 bg-emerald-300/10 text-emerald-300 shadow-[0_0_35px_rgba(34,197,94,0.18)]">
            <ShieldCheck className="h-9 w-9" />
          </div>
        </div>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-[94%] rounded-full bg-emerald-400 shadow-[0_0_24px_rgba(34,197,94,0.55)]" />
      </div>
    </Card>
  );
}

function AnalyzerPanel({
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
  transcriptionSource: "none" | "ai" | "simulated";
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
          disabled={isAnalyzing || !input.trim() || analysisStage === "transcribing"}
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
  transcriptionSource: "none" | "ai" | "simulated";
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

function LatestAnalysisPanel({
  analysis,
  isAnalyzing,
  aiEnabled,
  apiStatus,
  dangerous,
  onExport,
}: {
  analysis: ScamAnalysis;
  isAnalyzing: boolean;
  aiEnabled: boolean;
  apiStatus: "idle" | "ai" | "fallback" | "error";
  dangerous: boolean;
  onExport: () => void;
}) {
  const statusText = isAnalyzing
    ? "Analyzing"
    : aiEnabled
      ? "AI Review"
      : apiStatus === "fallback"
        ? "Rule Fallback"
        : apiStatus === "error"
          ? "Offline Fallback"
          : "Local Preview";

  return (
    <Card danger={dangerous}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.34em] text-cyan-300">
            Latest Analysis
          </p>
          <h2 className="mt-1 text-xl font-semibold text-white">
            Scam risk decision
          </h2>
        </div>

        <button
          onClick={onExport}
          className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-medium text-white/70"
        >
          View Report
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_148px]">
        <div>
          <div className="flex items-center gap-4">
            <p className="text-6xl font-bold tracking-tight text-red-400">
              {isAnalyzing ? "..." : `${analysis.scamProbability}%`}
            </p>

            <div className="rounded-xl border border-red-300/25 bg-red-300/10 px-4 py-3 text-red-100">
              <div className="flex items-center gap-2">
                <Skull className="h-5 w-5" />
                <span className="text-sm font-semibold">
                  {analysis.riskLevel} Risk
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <AnalysisMeta label="Scan probability" value={`${analysis.scamProbability}%`} />
            <AnalysisMeta label="Type" value={analysis.attackType} />
            <AnalysisMeta label="Source" value={statusText} />
            <AnalysisMeta label="Confidence" value={analysis.confidence} />
          </div>
        </div>

        <RadarCircle />
      </div>

      <div className="mt-4">
        <p className="mb-2 text-sm font-medium text-white">Key red flags</p>

        <div className="space-y-1.5">
          {(analysis.redFlags.length ? analysis.redFlags : ["No strong red flags detected"])
            .slice(0, 4)
            .map((flag) => (
              <div key={flag} className="flex items-center gap-2 text-sm text-white/70">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400 shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                {flag}
              </div>
            ))}
        </div>
      </div>
    </Card>
  );
}

function AnalysisMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-medium text-white">{value}</p>
    </div>
  );
}

function RadarCircle() {
  return (
    <div className="relative flex h-[148px] w-[148px] items-center justify-center overflow-hidden rounded-full border border-red-400/25 bg-red-500/5">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(239,68,68,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(239,68,68,0.12)_1px,transparent_1px)] bg-[size:14px_14px]" />
      <div className="absolute h-[118px] w-[118px] rounded-full border border-red-400/25" />
      <div className="absolute h-[82px] w-[82px] rounded-full border border-red-400/25" />
      <div className="absolute h-[46px] w-[46px] rounded-full border border-red-400/25" />
      <div className="absolute h-[1px] w-full bg-red-400/25" />
      <div className="absolute h-full w-[1px] bg-red-400/25" />
      <div className="absolute h-4 w-4 rounded-full bg-red-400 shadow-[0_0_28px_rgba(239,68,68,0.95)]" />
      <div className="absolute h-28 w-28 animate-pulse rounded-full bg-red-400/10" />
    </div>
  );
}

function RecentAlertsPanel() {
  const alerts = [
    {
      title: "High Risk Call Detected",
      detail: "Bank impersonation attempt",
      time: "2m ago",
      severity: "High",
      icon: <Phone className="h-4 w-4" />,
      tone: "red",
    },
    {
      title: "Suspicious Message",
      detail: "Prize claim link detected",
      time: "15m ago",
      severity: "Medium",
      icon: <MessageSquareText className="h-4 w-4" />,
      tone: "amber",
    },
    {
      title: "Unsafe Link Blocked",
      detail: "Phishing website detected",
      time: "31m ago",
      severity: "Medium",
      icon: <Globe className="h-4 w-4" />,
      tone: "cyan",
    },
  ];

  return (
    <Card danger>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
          <BadgeAlert className="h-5 w-5 text-red-300" />
          Recent Alerts
        </h3>

        <button className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-white/70">
          View All
        </button>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.title}
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3"
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                alert.tone === "red"
                  ? "bg-red-400/15 text-red-200"
                  : alert.tone === "amber"
                    ? "bg-amber-400/15 text-amber-200"
                    : "bg-cyan-400/15 text-cyan-200"
              }`}
            >
              {alert.icon}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{alert.title}</p>
              <p className="mt-0.5 truncate text-xs text-white/45">{alert.detail}</p>
            </div>

            <div className="text-right">
              <span
                className={`rounded-full border px-2 py-1 text-[10px] font-medium ${
                  alert.tone === "red"
                    ? "border-red-300/20 bg-red-300/10 text-red-100"
                    : "border-amber-300/20 bg-amber-300/10 text-amber-100"
                }`}
              >
                {alert.severity}
              </span>
              <p className="mt-1 text-[10px] text-white/35">{alert.time}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function DemoCasesPanel({
  selectedDemoId,
  onLoadDemo,
}: {
  selectedDemoId: string;
  onLoadDemo: (demo: DemoCase) => void;
}) {
  return (
    <Card>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.32em] text-cyan-300">
            Demo cases
          </p>
          <h3 className="mt-1 text-lg font-semibold text-[var(--fg)]">
            Realistic scam attempts
          </h3>
        </div>

        <p className="text-sm text-[var(--muted)]">{demoCases.length} cases</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {demoCases.map((demo) => (
          <button
            key={demo.id}
            onClick={() => onLoadDemo(demo)}
            className={`flex items-center justify-between gap-3 rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 ${
              selectedDemoId === demo.id
                ? "border-red-300/50 bg-red-300/10"
                : "border-[var(--line)] bg-white/[0.04] hover:border-cyan-300/30"
            }`}
          >
            <div>
              <p className="text-sm font-medium text-[var(--fg)]">{demo.title}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">{demo.subtitle}</p>
            </div>

            <ChevronRight className="h-4 w-4 shrink-0 text-[var(--muted2)]" />
          </button>
        ))}
      </div>
    </Card>
  );
}

function SignalPanel({
  title,
  icon,
  items,
  empty,
  tone,
}: {
  title: string;
  icon: ReactNode;
  items: string[];
  empty: string;
  tone: "red" | "amber";
}) {
  const toneClass =
    tone === "red"
      ? "border-red-300/15 bg-red-300/10 text-red-100"
      : "border-amber-300/15 bg-amber-300/10 text-amber-100";

  return (
    <Card>
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--fg)]">
        {icon}
        {title}
      </h3>

      <div className="space-y-2">
        {items.length ? (
          items.slice(0, 6).map((item) => (
            <div
              key={item}
              className={`rounded-xl border p-3 text-sm ${toneClass}`}
            >
              {item}
            </div>
          ))
        ) : (
          <p className="text-sm text-[var(--muted)]">{empty}</p>
        )}
      </div>
    </Card>
  );
}

function SafeReplyPanel({
  analysis,
  familyMode,
  hasAnalyzed,
}: {
  analysis: ScamAnalysis;
  familyMode: boolean;
  hasAnalyzed: boolean;
}) {
  return (
    <section className="rounded-[18px] border border-emerald-300/15 bg-emerald-300/10 p-4 backdrop-blur-xl">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--fg)]">
        <ShieldCheck className="h-5 w-5 text-emerald-300" />
        Safe action
      </h3>

      <p className="text-sm leading-6 text-[var(--muted)]">
        {analysis.safeReply}
      </p>

      {familyMode && (
        <div className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/10 p-3">
          <p className="mb-1 text-xs font-medium uppercase tracking-[0.18em] text-amber-200">
            Family Mode
          </p>
          <p className="text-sm leading-6 text-[var(--muted)]">
            {analysis.familyModeAdvice}
          </p>
        </div>
      )}

      {!hasAnalyzed && (
        <p className="mt-4 text-xs text-[var(--muted2)]">
          Run analysis to save this result into scan history.
        </p>
      )}
    </section>
  );
}

function EvidencePanel({ analysis }: { analysis: ScamAnalysis }) {
  return (
    <Card>
      <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-[var(--fg)]">
        <ClipboardCheck className="h-5 w-5 text-cyan-300" />
        Evidence highlights
      </h3>

      <div className="space-y-3">
        {analysis.evidence.length ? (
          analysis.evidence.map((item, index) => (
            <div
              key={`${item.text}-${index}`}
              className="rounded-2xl border border-[var(--line)] bg-white/[0.04] p-4"
            >
              <p className="font-mono text-sm text-cyan-300">“{item.text}”</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                {item.reason}
              </p>
            </div>
          ))
        ) : (
          <p className="rounded-2xl border border-[var(--line)] bg-white/[0.04] p-4 text-sm text-[var(--muted)]">
            No suspicious evidence highlighted yet.
          </p>
        )}
      </div>
    </Card>
  );
}

function NextStepsPanel({
  analysis,
  input,
  mode,
  aiEnabled,
}: {
  analysis: ScamAnalysis;
  input: string;
  mode: InputMode;
  aiEnabled: boolean;
}) {
  return (
    <Card>
      <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-[var(--fg)]">
        <CheckCircle2 className="h-5 w-5 text-emerald-300" />
        What to do now
      </h3>

      <div className="space-y-3">
        {analysis.nextSteps.map((step) => (
          <div
            key={step}
            className="flex gap-3 rounded-xl border border-[var(--line)] bg-white/[0.04] p-3 text-sm text-[var(--muted)]"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
            <span>{step}</span>
          </div>
        ))}
      </div>

      <button
        onClick={() => downloadReport({ input, mode, analysis, aiEnabled })}
        disabled={!input.trim()}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white disabled:opacity-50"
      >
        <Download className="h-4 w-4" />
        Export safety report
      </button>
    </Card>
  );
}

function HistoryPanel({
  history,
  onClear,
}: {
  history: ScanHistoryItem[];
  onClear: () => void;
}) {
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-xl font-semibold text-[var(--fg)]">
          <History className="h-5 w-5 text-cyan-300" />
          Scan history
        </h3>

        <button
          onClick={onClear}
          className="text-sm text-[var(--muted)] hover:text-[var(--fg)]"
        >
          Clear
        </button>
      </div>

      <div className="space-y-3">
        {history.length ? (
          history.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-[var(--line)] bg-white/[0.04] p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-[var(--fg)]">{item.attackType}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {new Date(item.createdAt).toLocaleString()} • {item.mode}
                  </p>
                </div>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${getRiskStyle(
                    item.riskLevel
                  )}`}
                >
                  {item.score}%
                </span>
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-2xl border border-[var(--line)] bg-white/[0.04] p-4 text-sm text-[var(--muted)]">
            No scans yet. Run your first analysis.
          </p>
        )}
      </div>
    </Card>
  );
}

function EducationPanel() {
  return (
    <Card>
      <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-[var(--fg)]">
        <Sparkles className="h-5 w-5 text-amber-300" />
        Scam education
      </h3>

      <div className="grid gap-4 md:grid-cols-2">
        <EducationCard
          icon={<AlertTriangle className="h-5 w-5" />}
          title="Scammers create urgency"
          text="They push people to act fast so they do not have time to verify the situation."
        />
        <EducationCard
          icon={<Ban className="h-5 w-5" />}
          title="Codes should never be shared"
          text="A real bank or company will not ask you to read a one-time code over the phone."
        />
        <EducationCard
          icon={<Globe className="h-5 w-5" />}
          title="Use official channels"
          text="Hang up and contact the organization using its official website or phone number."
        />
        <EducationCard
          icon={<Users className="h-5 w-5" />}
          title="Protect family members"
          text="Family Mode explains risk in simpler language for people who may be less comfortable with technology."
        />
      </div>
    </Card>
  );
}

function EducationCard({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white/[0.04] p-4">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-300/10 text-amber-300">
        {icon}
      </div>
      <p className="font-medium text-[var(--fg)]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{text}</p>
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

function MiniLineChart({ danger }: { danger: boolean }) {
  const color = danger ? "bg-red-400" : "bg-cyan-300";

  return (
    <div className="flex h-full items-end gap-1">
      {[20, 26, 18, 30, 24, 37, 21, 44, 28, 33].map((height, index) => (
        <span
          key={`${height}-${index}`}
          className={`w-2 rounded-full ${color} opacity-80 shadow-[0_0_12px_currentColor]`}
          style={{ height }}
        />
      ))}
    </div>
  );
}

function MiniBars() {
  return (
    <div className="flex h-20 items-end gap-1">
      {[18, 28, 42, 34, 58, 77, 40, 66, 90, 36, 62, 48, 74, 32].map(
        (height, index) => (
          <span
            key={`${height}-${index}`}
            className="w-1.5 rounded-full bg-red-400/80 shadow-[0_0_10px_rgba(239,68,68,0.6)]"
            style={{ height }}
          />
        )
      )}
    </div>
  );
}