"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
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
  Phone,
  Radar,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Skull,
  Sparkles,
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

function getRiskStyle(risk: string) {
  if (risk === "Critical") return "border-red-400/35 bg-red-500/10 text-red-100";
  if (risk === "High") return "border-orange-400/35 bg-orange-500/10 text-orange-100";
  if (risk === "Medium") return "border-amber-400/35 bg-amber-500/10 text-amber-100";
  return "border-emerald-400/35 bg-emerald-500/10 text-emerald-100";
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
  const [mode, setMode] = useState<InputMode>(defaultDemoCase.mode);
  const [input, setInput] = useState(defaultDemoCase.content);
  const [selectedDemoId, setSelectedDemoId] = useState(defaultDemoCase.id);
  const [familyMode, setFamilyMode] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

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
  }

  function loadDemo(demo: DemoCase) {
    setSelectedDemoId(demo.id);
    setMode(demo.mode);
    setInput(demo.content);
    setAudioFileName(null);
    resetServerResult();
  }

  function handleAudioUpload(file: File | null) {
    if (!file) return;

    setMode("audio");
    setAudioFileName(file.name);
    setSelectedDemoId("fake-bank-call");
    setInput(simulatedAudioTranscript);
    resetServerResult();
  }

  async function runAnalysis() {
    if (!input.trim()) return;

    setIsAnalyzing(true);
    setApiStatus("idle");

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
    <main className="relative min-h-screen overflow-hidden bg-[#050914] text-slate-50">
      <div className="guard-glow absolute inset-0" />
      <div className="guard-grid absolute inset-0 opacity-80" />
      <div className="dots pointer-events-none absolute right-0 top-24 h-[430px] w-[430px] opacity-40" />

      <div className="relative z-10 flex min-h-screen">
        <Sidebar />

        <section className="flex min-w-0 flex-1 flex-col">
          <TopBar />

          <div className="mx-auto w-full max-w-[1510px] px-5 py-5 lg:px-7">
            <div className="mb-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <OverviewCard
                icon={<ShieldCheck className="h-7 w-7" />}
                label="Protection status"
                value="Active"
                detail="Real-time scam monitoring"
                tone="cyan"
              />

              <OverviewCard
                icon={<Radar className="h-7 w-7" />}
                label="Risk score"
                value={`${analysis.scamProbability}/100`}
                detail={`${analysis.riskLevel} risk`}
                tone="red"
              />

              <OverviewCard
                icon={<Siren className="h-7 w-7" />}
                label="Threat type"
                value={analysis.attackType}
                detail="Latest analysis pattern"
                tone="red"
              />

              <OverviewCard
                icon={<Zap className="h-7 w-7" />}
                label="Review engine"
                value={aiEnabled ? "AI review" : "Fallback"}
                detail={aiEnabled ? "Semantic analysis" : "Rules active"}
                tone="emerald"
              />
            </div>

            <div className="mb-5 grid gap-5 xl:grid-cols-[1.06fr_0.94fr]">
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
                onAnalyze={runAnalysis}
                onAudioUpload={handleAudioUpload}
                audioFileName={audioFileName}
              />

              <ResultPanel
                analysis={analysis}
                isAnalyzing={isAnalyzing}
                aiEnabled={aiEnabled}
                apiStatus={apiStatus}
                onExport={() =>
                  downloadReport({ input, mode, analysis, aiEnabled })
                }
              />
            </div>

            <div className="mb-5 grid gap-5 xl:grid-cols-[0.72fr_1.28fr]">
              <div className="space-y-5">
                <DemoCasesPanel
                  selectedDemoId={selectedDemoId}
                  onLoadDemo={loadDemo}
                />

                <RecentAlertsPanel />
              </div>

              <div className="grid gap-5 lg:grid-cols-3">
                <SignalPanel
                  title="Key red flags"
                  icon={<Siren className="h-5 w-5 text-red-300" />}
                  items={analysis.redFlags}
                  empty="No strong red flags detected."
                  tone="red"
                />

                <SignalPanel
                  title="Tactics detected"
                  icon={<BellRing className="h-5 w-5 text-amber-300" />}
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

            <div className="mb-5 grid gap-5 xl:grid-cols-[1fr_1fr]">
              <EvidencePanel analysis={analysis} />
              <NextStepsPanel
                analysis={analysis}
                input={input}
                mode={mode}
                aiEnabled={aiEnabled}
              />
            </div>

            <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
              <HistoryPanel history={history} onClear={() => setHistory([])} />
              <EducationPanel />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Sidebar() {
  const items = [
    {
      label: "Dashboard",
      icon: <LayoutDashboard className="h-4 w-4" />,
      active: true,
    },
    { label: "Alerts", icon: <Bell className="h-4 w-4" /> },
    { label: "Call Protection", icon: <Phone className="h-4 w-4" /> },
    {
      label: "Message Protection",
      icon: <MessageSquareText className="h-4 w-4" />,
    },
    { label: "Audio Scanner", icon: <AudioLines className="h-4 w-4" /> },
    { label: "Trusted Contacts", icon: <UserCheck className="h-4 w-4" /> },
    { label: "Reports", icon: <FileText className="h-4 w-4" /> },
    { label: "Privacy Center", icon: <Lock className="h-4 w-4" /> },
    { label: "Settings", icon: <Settings className="h-4 w-4" /> },
  ];

  return (
    <aside className="side hidden w-[292px] shrink-0 border-r border-cyan-300/10 p-5 backdrop-blur-xl lg:block">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-[1.4rem] border border-cyan-300/35 bg-cyan-300/10 text-cyan-200 shadow-[0_0_35px_rgba(34,211,238,0.18)]">
          <Fingerprint className="h-8 w-8" />
        </div>

        <div>
          <p className="text-2xl font-black tracking-tight text-white">
            CallProof
          </p>
          <p className="text-xs font-bold text-cyan-300">Scam Protection</p>
        </div>
      </div>

      <nav className="space-y-2">
        {items.map((item, index) => (
          <button
            key={item.label}
            className={`relative flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold transition ${
              item.active
                ? "bg-cyan-300/15 text-cyan-100 shadow-[inset_0_0_0_1px_rgba(103,232,249,0.18)]"
                : "text-white/55 hover:bg-white/[0.04] hover:text-white"
            }`}
          >
            {item.icon}
            {item.label}

            {index === 1 && (
              <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                3
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="mt-8 rounded-3xl border border-cyan-300/15 bg-cyan-300/10 p-4">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950">
          <ShieldCheck className="h-5 w-5" />
        </div>

        <p className="font-black text-white">Stay one step ahead</p>

        <p className="mt-2 text-sm leading-6 text-white/50">
          CallProof checks suspicious calls, messages, and audio before you
          respond.
        </p>

        <button className="mt-4 w-full rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm font-black text-cyan-100">
          Protection active
        </button>
      </div>

      <div className="mt-7">
        <p className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-cyan-200">
          Protection signals
        </p>

        <div className="grid grid-cols-3 gap-3 text-center">
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-sm font-black text-white">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-white/35">
        {label}
      </p>
    </div>
  );
}

function TopBar() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/70 px-5 py-4 backdrop-blur-xl lg:px-7">
      <div className="mx-auto flex w-full max-w-[1510px] items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.32em] text-cyan-200">
            Protection overview
          </p>

          <h1 className="mt-1 text-2xl font-black tracking-tight text-white">
            Scam call and message intelligence center
          </h1>
        </div>

        <div className="hidden min-w-[390px] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white/45 md:flex">
          <Search className="h-4 w-4" />
          <span className="text-sm">
            Search reports, red flags, numbers, or messages...
          </span>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <button className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/70">
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-400" />
          </button>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2">
            <p className="text-sm font-bold text-white">Protected Demo</p>
            <p className="text-xs text-cyan-200/70">Live risk monitoring</p>
          </div>
        </div>
      </div>
    </header>
  );
}

function OverviewCard({
  icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
  tone: "cyan" | "red" | "emerald";
}) {
  const toneMap = {
    cyan: "text-cyan-200 bg-cyan-300/10 border-cyan-300/15",
    red: "text-red-200 bg-red-300/10 border-red-300/15",
    emerald: "text-emerald-200 bg-emerald-300/10 border-emerald-300/15",
  };

  return (
    <section className="card rounded-[2rem] border border-white/10 p-5 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl border ${toneMap[tone]}`}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/40">
            {label}
          </p>

          <p className="mt-1 truncate text-xl font-black text-white">{value}</p>

          <p className="mt-1 text-sm text-white/45">{detail}</p>
        </div>
      </div>
    </section>
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
  onAnalyze: () => void;
  onAudioUpload: (file: File | null) => void;
  audioFileName: string | null;
}) {
  return (
    <section className="card rounded-[2rem] border border-cyan-300/15 p-5 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-200">
            Scan your content
          </p>
          <h2 className="mt-1 text-2xl font-black text-white">
            Paste a message, transcript, or upload audio
          </h2>
        </div>

        <label className="flex cursor-pointer items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-sm font-bold text-amber-100">
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
          label="Call transcript"
          onClick={() => setMode("transcript")}
        />
        <ModeButton
          active={mode === "audio"}
          icon={<AudioLines className="h-4 w-4" />}
          label="Audio upload"
          onClick={() => setMode("audio")}
        />
      </div>

      {mode === "audio" && (
        <div className="mb-4 rounded-3xl border border-dashed border-cyan-300/30 bg-cyan-300/10 p-4">
          <label className="flex cursor-pointer flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-white">Upload call recording</p>
                <p className="text-sm text-white/45">
                  For MVP demo, upload fills a simulated transcript.
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

            <span className="rounded-full bg-white px-4 py-2 text-xs font-black text-slate-950">
              Choose file
            </span>
          </label>

          {audioFileName && (
            <p className="mt-3 flex items-center gap-2 text-sm text-cyan-100">
              <FileAudio className="h-4 w-4" />
              Uploaded: {audioFileName}
            </p>
          )}
        </div>
      )}

      <textarea
        value={input}
        onChange={(event) => setInput(event.target.value)}
        rows={9}
        className="thin-scrollbar w-full resize-none rounded-3xl border border-white/10 bg-black/45 p-5 font-mono text-sm leading-6 text-white outline-none transition placeholder:text-white/25 focus:border-cyan-300/50"
        placeholder="Paste a suspicious message, call transcript, or uploaded audio transcript here..."
      />

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={onAnalyze}
          disabled={isAnalyzing || !input.trim()}
          className="rounded-full bg-red-500 px-6 py-3 text-sm font-black text-white shadow-[0_0_30px_rgba(239,68,68,0.28)] transition hover:bg-red-400 disabled:opacity-50"
        >
          {isAnalyzing ? "Analyzing risk..." : "Analyze now"}
        </button>

        <button
          onClick={() => setInput("")}
          className="rounded-full border border-white/10 bg-white/[0.03] px-6 py-3 text-sm font-black text-white transition hover:border-red-300/30"
        >
          Clear
        </button>
      </div>
    </section>
  );
}

function ResultPanel({
  analysis,
  isAnalyzing,
  aiEnabled,
  apiStatus,
  onExport,
}: {
  analysis: ScamAnalysis;
  isAnalyzing: boolean;
  aiEnabled: boolean;
  apiStatus: "idle" | "ai" | "fallback" | "error";
  onExport: () => void;
}) {
  const statusText = isAnalyzing
    ? "Analyzing"
    : aiEnabled
      ? "AI semantic review"
      : apiStatus === "fallback"
        ? "Rule fallback"
        : apiStatus === "error"
          ? "Offline fallback"
          : "Local preview";

  const isDanger =
    analysis.riskLevel === "Critical" || analysis.riskLevel === "High";

  return (
    <section className="card rounded-[2rem] border border-white/10 p-5 backdrop-blur-xl">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-200">
            Latest analysis
          </p>

          <h2 className="mt-1 text-2xl font-black tracking-tight text-white">
            Scam risk decision
          </h2>
        </div>

        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-black text-white/70">
          {statusText}
        </span>
      </div>

      <div
        className={`relative overflow-hidden rounded-[2rem] border p-5 ${
          isDanger
            ? "red-card border-red-400/35"
            : getRiskStyle(analysis.riskLevel)
        }`}
      >
        <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full border border-red-300/20" />
        <div className="absolute -right-3 top-12 h-20 w-20 rounded-full border border-red-300/10" />

        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] opacity-75">
              Scam probability
            </p>

            <p className="mt-2 text-7xl font-black tracking-tight text-white">
              {isAnalyzing ? "..." : `${analysis.scamProbability}%`}
            </p>

            <p className="mt-2 text-lg font-black text-white">
              {analysis.riskLevel} risk
            </p>
          </div>

          <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-red-300/25 bg-red-400/15 text-red-200 shadow-[0_0_35px_rgba(248,113,113,0.18)]">
            {isDanger ? (
              <Skull className="h-8 w-8" />
            ) : (
              <ShieldCheck className="h-8 w-8" />
            )}
          </div>
        </div>

        <div className="relative mt-5 h-3 overflow-hidden rounded-full bg-white/15">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              isDanger ? "bg-red-300" : "bg-cyan-300"
            }`}
            style={{ width: `${analysis.scamProbability}%` }}
          />
        </div>

        <div className="relative mt-4 grid gap-3 sm:grid-cols-3">
          <ResultMeta label="Risk" value={analysis.riskLevel} />
          <ResultMeta label="Confidence" value={analysis.confidence} />
          <ResultMeta label="Type" value={analysis.attackType} />
        </div>
      </div>

      <div className="mt-4 rounded-3xl border border-white/10 bg-black/25 p-4">
        <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
          Explanation
        </p>

        <p className="text-sm leading-6 text-white/65">{analysis.summary}</p>
      </div>

      <button
        onClick={onExport}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200"
      >
        <Download className="h-4 w-4" />
        Export safety report
      </button>
    </section>
  );
}

function ResultMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
      <p className="text-[10px] uppercase tracking-[0.18em] opacity-50">
        {label}
      </p>
      <p className="mt-1 truncate font-black">{value}</p>
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
      className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-black transition ${
        active
          ? "border-red-300/50 bg-red-300/15 text-red-100"
          : "border-white/10 bg-white/[0.03] text-white/55 hover:border-cyan-300/30"
      }`}
    >
      {icon}
      {label}
    </button>
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
    <section className="card rounded-[2rem] border border-white/10 p-5 backdrop-blur-xl">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-200">
            Demo cases
          </p>
          <h3 className="mt-1 text-xl font-black text-white">
            Realistic scam attempts
          </h3>
        </div>

        <p className="text-sm text-white/40">{demoCases.length} cases</p>
      </div>

      <div className="space-y-3">
        {demoCases.slice(0, 5).map((demo) => (
          <button
            key={demo.id}
            onClick={() => onLoadDemo(demo)}
            className={`flex w-full items-center justify-between gap-3 rounded-3xl border p-4 text-left transition hover:-translate-y-0.5 ${
              selectedDemoId === demo.id
                ? "border-red-300/50 bg-red-300/10"
                : "border-white/10 bg-black/25 hover:border-cyan-300/30"
            }`}
          >
            <div>
              <p className="font-bold text-white">{demo.title}</p>
              <p className="mt-1 text-sm text-white/45">{demo.subtitle}</p>
            </div>

            <ChevronRight className="h-4 w-4 text-white/35" />
          </button>
        ))}
      </div>
    </section>
  );
}

function RecentAlertsPanel() {
  const alerts = [
    {
      title: "Potential fraudulent call",
      detail: "Bank impersonation / OTP request",
      time: "2m ago",
      severity: "High risk",
      icon: <Phone className="h-5 w-5" />,
    },
    {
      title: "Suspicious message",
      detail: "Delivery payment link detected",
      time: "15m ago",
      severity: "Scam",
      icon: <MessageSquareText className="h-5 w-5" />,
    },
    {
      title: "Unsafe link pattern",
      detail: "Shortened URL and urgency language",
      time: "31m ago",
      severity: "Warning",
      icon: <Globe className="h-5 w-5" />,
    },
  ];

  return (
    <section className="red-card rounded-[2rem] border border-red-400/25 p-5 backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-xl font-black text-white">
          <BadgeAlert className="h-5 w-5 text-red-300" />
          Recent alerts
        </h3>

        <button className="text-sm font-bold text-red-200/80">View all</button>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.title}
            className="flex items-center gap-3 rounded-3xl border border-red-300/10 bg-black/25 p-4"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-400/15 text-red-200">
              {alert.icon}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate font-black text-white">{alert.title}</p>
              <p className="mt-1 text-sm text-white/45">{alert.detail}</p>
            </div>

            <div className="text-right">
              <span className="rounded-full border border-red-300/20 bg-red-300/10 px-3 py-1 text-xs font-black text-red-100">
                {alert.severity}
              </span>
              <p className="mt-2 text-xs text-white/35">{alert.time}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
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
    <section className="card rounded-[2rem] border border-white/10 p-5 backdrop-blur-xl">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-black text-white">
        {icon}
        {title}
      </h3>

      <div className="space-y-2">
        {items.length ? (
          items.slice(0, 6).map((item) => (
            <div
              key={item}
              className={`rounded-2xl border p-3 text-sm ${toneClass}`}
            >
              {item}
            </div>
          ))
        ) : (
          <p className="text-sm text-white/45">{empty}</p>
        )}
      </div>
    </section>
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
    <section className="rounded-[2rem] border border-emerald-300/15 bg-emerald-300/10 p-5 backdrop-blur-xl">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-black text-white">
        <ShieldCheck className="h-5 w-5 text-emerald-300" />
        Safe action
      </h3>

      <p className="text-sm leading-6 text-white/70">{analysis.safeReply}</p>

      {familyMode && (
        <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3">
          <p className="mb-1 text-xs font-black uppercase tracking-[0.18em] text-amber-100">
            Family Mode
          </p>
          <p className="text-sm leading-6 text-white/70">
            {analysis.familyModeAdvice}
          </p>
        </div>
      )}

      {!hasAnalyzed && (
        <p className="mt-4 text-xs text-white/35">
          Run analysis to save this result into scan history.
        </p>
      )}
    </section>
  );
}

function EvidencePanel({ analysis }: { analysis: ScamAnalysis }) {
  return (
    <section className="card rounded-[2rem] border border-white/10 p-5 backdrop-blur-xl">
      <h3 className="mb-4 flex items-center gap-2 text-2xl font-black text-white">
        <ClipboardCheck className="h-6 w-6 text-cyan-200" />
        Evidence highlights
      </h3>

      <div className="space-y-3">
        {analysis.evidence.length ? (
          analysis.evidence.map((item, index) => (
            <div
              key={`${item.text}-${index}`}
              className="rounded-3xl border border-white/10 bg-black/25 p-4"
            >
              <p className="font-mono text-sm text-cyan-100">“{item.text}”</p>
              <p className="mt-2 text-sm leading-6 text-white/50">
                {item.reason}
              </p>
            </div>
          ))
        ) : (
          <p className="rounded-3xl border border-white/10 bg-black/25 p-4 text-sm text-white/45">
            No suspicious evidence highlighted yet.
          </p>
        )}
      </div>
    </section>
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
    <section className="card rounded-[2rem] border border-white/10 p-5 backdrop-blur-xl">
      <h3 className="mb-4 flex items-center gap-2 text-2xl font-black text-white">
        <CheckCircle2 className="h-6 w-6 text-emerald-300" />
        What to do now
      </h3>

      <div className="space-y-3">
        {analysis.nextSteps.map((step) => (
          <div
            key={step}
            className="flex gap-3 rounded-2xl border border-white/10 bg-black/25 p-3 text-sm text-white/65"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
            <span>{step}</span>
          </div>
        ))}
      </div>

      <button
        onClick={() => downloadReport({ input, mode, analysis, aiEnabled })}
        disabled={!input.trim()}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-emerald-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-white disabled:opacity-50"
      >
        <Download className="h-4 w-4" />
        Export safety report
      </button>
    </section>
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
    <section className="card rounded-[2rem] border border-white/10 p-5 backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-2xl font-black text-white">
          <History className="h-6 w-6 text-cyan-200" />
          Scan history
        </h3>

        <button
          onClick={onClear}
          className="text-sm text-white/40 hover:text-white"
        >
          Clear
        </button>
      </div>

      <div className="space-y-3">
        {history.length ? (
          history.map((item) => (
            <div
              key={item.id}
              className="rounded-3xl border border-white/10 bg-black/25 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-black text-white">{item.attackType}</p>
                  <p className="mt-1 text-xs text-white/40">
                    {new Date(item.createdAt).toLocaleString()} • {item.mode}
                  </p>
                </div>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-black ${getRiskStyle(
                    item.riskLevel
                  )}`}
                >
                  {item.score}%
                </span>
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-3xl border border-white/10 bg-black/25 p-4 text-sm text-white/45">
            No scans yet. Run your first analysis.
          </p>
        )}
      </div>
    </section>
  );
}

function EducationPanel() {
  return (
    <section className="card rounded-[2rem] border border-white/10 p-5 backdrop-blur-xl">
      <h3 className="mb-4 flex items-center gap-2 text-2xl font-black text-white">
        <Sparkles className="h-6 w-6 text-amber-300" />
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
    </section>
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
    <div className="rounded-3xl border border-white/10 bg-black/25 p-4">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-300/10 text-amber-200">
        {icon}
      </div>
      <p className="font-black text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-white/50">{text}</p>
    </div>
  );
}