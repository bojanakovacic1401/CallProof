"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  AudioLines,
  Ban,
  BellRing,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileAudio,
  History,
  MessageSquareText,
  Mic,
  Radar,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Sparkles,
  Upload,
  Users,
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

function getRiskStyle(risk: string) {
  if (risk === "Critical") return "border-red-300/30 bg-red-400/10 text-red-100";
  if (risk === "High")
    return "border-orange-300/30 bg-orange-400/10 text-orange-100";
  if (risk === "Medium")
    return "border-amber-300/30 bg-amber-400/10 text-amber-100";
  return "border-emerald-300/30 bg-emerald-400/10 text-emerald-100";
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
}: {
  input: string;
  mode: InputMode;
  analysis: ScamAnalysis;
}) {
  const report = `CallProof Safety Report

Mode: ${mode}
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

  const analysis = useMemo(
    () => analyzeScamContent({ content: input, mode, familyMode }),
    [input, mode, familyMode]
  );

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

  function loadDemo(demo: DemoCase) {
    setSelectedDemoId(demo.id);
    setMode(demo.mode);
    setInput(demo.content);
    setAudioFileName(null);
    setHasAnalyzed(false);
  }

  async function runAnalysis() {
    setIsAnalyzing(true);
    await new Promise((resolve) => setTimeout(resolve, 850));
    setHasAnalyzed(true);
    setHistory((prev) =>
      [createHistoryItem({ mode, analysis }), ...prev].slice(0, 8)
    );
    setIsAnalyzing(false);
  }

  function handleAudioUpload(file: File | null) {
    if (!file) return;

    setMode("audio");
    setAudioFileName(file.name);
    setSelectedDemoId("fake-bank-call");
    setInput(simulatedAudioTranscript);
    setHasAnalyzed(false);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050816] text-slate-50">
      <div className="soft-glow absolute inset-0" />
      <div className="grid-bg absolute inset-0 opacity-80" />

      <div className="relative z-10 mx-auto w-full max-w-[1500px] px-5 py-5 lg:px-6">
        <nav className="mb-5 flex items-center justify-between rounded-[1.5rem] border border-cyan-200/15 bg-black/35 px-5 py-4 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-black tracking-[0.34em] text-white">
                CALLPROOF
              </p>
              <p className="text-xs text-white/40">
                Scam call and message protection
              </p>
            </div>
          </div>

          <button
            onClick={runAnalysis}
            className="rounded-full bg-cyan-300 px-5 py-2 text-sm font-black text-slate-950 transition hover:bg-white"
          >
            Analyze
          </button>
        </nav>

        <section className="mb-6 grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
          <HeroCard analysis={analysis} onDemo={() => loadDemo(demoCases[0])} />

          <TopAnalyzer
            mode={mode}
            setMode={setMode}
            input={input}
            setInput={setInput}
            familyMode={familyMode}
            setFamilyMode={setFamilyMode}
            isAnalyzing={isAnalyzing}
            onAnalyze={runAnalysis}
            onAudioUpload={handleAudioUpload}
            audioFileName={audioFileName}
          />
        </section>

        <section className="mb-6 grid gap-5 xl:grid-cols-[0.72fr_1.28fr]">
          <ScoreCard analysis={analysis} isAnalyzing={isAnalyzing} />

          <div className="grid gap-5 lg:grid-cols-3">
            <CompactPanel
              icon={<Siren className="h-5 w-5 text-red-300" />}
              title="Red flags"
              items={analysis.redFlags}
              empty="No strong red flags detected."
              tone="red"
            />
            <CompactPanel
              icon={<BellRing className="h-5 w-5 text-amber-300" />}
              title="Tactics"
              items={analysis.tactics}
              empty="No manipulation tactics detected."
              tone="amber"
            />
            <SafeReplyCard analysis={analysis} familyMode={familyMode} />
          </div>
        </section>

        <section className="mb-6 rounded-[2rem] border border-white/10 glass p-5 backdrop-blur-xl">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-200">
                Demo cases
              </p>
              <h2 className="mt-1 text-2xl font-black text-white">
                Try realistic scam scenarios
              </h2>
            </div>
            <p className="text-sm text-white/45">
              {demoCases.length} ready-to-test examples
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {demoCases.map((demo) => (
              <button
                key={demo.id}
                onClick={() => loadDemo(demo)}
                className={`rounded-3xl border p-4 text-left transition hover:-translate-y-0.5 ${
                  selectedDemoId === demo.id
                    ? "border-cyan-300/60 bg-cyan-300/10 shadow-[0_0_30px_rgba(103,232,249,0.16)]"
                    : "border-white/10 bg-black/25 hover:border-cyan-300/30"
                }`}
              >
                <p className="font-bold text-white">{demo.title}</p>
                <p className="mt-1 text-sm text-white/45">{demo.subtitle}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="mb-6 grid gap-5 xl:grid-cols-[1fr_1fr]">
          <EvidencePanel analysis={analysis} />
          <NextStepsPanel
            analysis={analysis}
            input={input}
            mode={mode}
            hasAnalyzed={hasAnalyzed}
          />
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
          <HistoryPanel history={history} onClear={() => setHistory([])} />
          <EducationPanel />
        </section>
      </div>
    </main>
  );
}

function HeroCard({
  analysis,
  onDemo,
}: {
  analysis: ScamAnalysis;
  onDemo: () => void;
}) {
  return (
    <section className="rounded-[2rem] border border-white/10 glass p-6 backdrop-blur-xl">
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-bold text-cyan-100">
        <Radar className="h-4 w-4" />
        Real-time fraud risk check
      </div>

      <h1 className="text-4xl font-black tracking-tight text-white md:text-6xl">
        Know before you <span className="text-cyan-300">respond.</span>
      </h1>

      <p className="mt-4 text-sm leading-6 text-white/55 md:text-base">
        CallProof checks suspicious calls, messages, and uploaded audio for scam
        probability, manipulation tactics, red flags, and safe next steps.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <HeroMini label="Current risk" value={analysis.riskLevel} />
        <HeroMini label="Probability" value={`${analysis.scamProbability}%`} />
        <HeroMini label="Type" value={analysis.attackType} />
      </div>

      <button
        onClick={onDemo}
        className="mt-6 w-full rounded-full border border-cyan-300/20 bg-cyan-300/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-300 hover:text-slate-950"
      >
        Load fake bank call demo
      </button>
    </section>
  );
}

function HeroMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/25 p-3">
      <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-black text-white">{value}</p>
    </div>
  );
}

function TopAnalyzer({
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
    <section className="rounded-[2rem] border border-cyan-300/15 bg-slate-950/70 p-5 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-200">
            Analyze now
          </p>
          <h2 className="mt-1 text-2xl font-black text-white">
            Paste, type, or upload suspicious content
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
          <label className="flex cursor-pointer items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-white">Upload call recording</p>
                <p className="text-sm text-white/45">
                  MVP simulates transcription after upload.
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
        rows={10}
        className="w-full resize-none rounded-3xl border border-white/10 bg-black/45 p-5 font-mono text-sm leading-6 text-white outline-none transition placeholder:text-white/25 focus:border-cyan-300/50"
        placeholder="Paste a suspicious message, call transcript, or uploaded audio transcript here..."
      />

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={onAnalyze}
          disabled={isAnalyzing}
          className="rounded-full bg-cyan-300 px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-white disabled:opacity-60"
        >
          {isAnalyzing ? "Analyzing scam risk..." : "Analyze content"}
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

function ModeButton({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-black transition ${
        active
          ? "border-cyan-300/50 bg-cyan-300/15 text-cyan-100"
          : "border-white/10 bg-white/[0.03] text-white/55 hover:border-cyan-300/30"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function ScoreCard({
  analysis,
  isAnalyzing,
}: {
  analysis: ScamAnalysis;
  isAnalyzing: boolean;
}) {
  return (
    <section
      className={`rounded-[2rem] border p-6 backdrop-blur-xl ${getRiskStyle(
        analysis.riskLevel
      )}`}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] opacity-70">
            Scam probability
          </p>
          <p className="mt-2 text-7xl font-black">
            {isAnalyzing ? "..." : `${analysis.scamProbability}%`}
          </p>
        </div>
        <ShieldAlert className="h-8 w-8 opacity-80" />
      </div>

      <div className="mb-4 h-3 overflow-hidden rounded-full bg-white/15">
        <div
          className="h-full rounded-full bg-white transition-all duration-700"
          style={{ width: `${analysis.scamProbability}%` }}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <ScoreMeta label="Risk level" value={analysis.riskLevel} />
        <ScoreMeta label="Confidence" value={analysis.confidence} />
        <ScoreMeta label="Attack type" value={analysis.attackType} wide />
      </div>

      <p className="mt-4 text-sm leading-6 opacity-75">{analysis.summary}</p>
    </section>
  );
}

function ScoreMeta({
  label,
  value,
  wide,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-black/20 p-3 ${
        wide ? "sm:col-span-2" : ""
      }`}
    >
      <p className="text-[10px] uppercase tracking-[0.18em] opacity-50">
        {label}
      </p>
      <p className="mt-1 font-black">{value}</p>
    </div>
  );
}

function CompactPanel({
  icon,
  title,
  items,
  empty,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
  empty: string;
  tone: "red" | "amber";
}) {
  const toneClass =
    tone === "red"
      ? "border-red-300/15 bg-red-300/10 text-red-100"
      : "border-amber-300/15 bg-amber-300/10 text-amber-100";

  return (
    <section className="rounded-[2rem] border border-white/10 glass p-5 backdrop-blur-xl">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-black text-white">
        {icon}
        {title}
      </h3>

      <div className="space-y-2">
        {items.length ? (
          items.slice(0, 5).map((item) => (
            <div key={item} className={`rounded-2xl border p-3 text-sm ${toneClass}`}>
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

function SafeReplyCard({
  analysis,
  familyMode,
}: {
  analysis: ScamAnalysis;
  familyMode: boolean;
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
    </section>
  );
}

function EvidencePanel({ analysis }: { analysis: ScamAnalysis }) {
  return (
    <section className="rounded-[2rem] border border-white/10 glass p-5 backdrop-blur-xl">
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
  hasAnalyzed,
}: {
  analysis: ScamAnalysis;
  input: string;
  mode: InputMode;
  hasAnalyzed: boolean;
}) {
  return (
    <section className="rounded-[2rem] border border-white/10 glass p-5 backdrop-blur-xl">
      <h3 className="mb-4 flex items-center gap-2 text-2xl font-black text-white">
        <CheckCircle2 className="h-6 w-6 text-emerald-300" />
        What to do now
      </h3>

      <div className="space-y-3">
        {analysis.nextSteps.map((step) => (
          <div key={step} className="flex gap-3 rounded-2xl border border-white/10 bg-black/25 p-3 text-sm text-white/65">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
            <span>{step}</span>
          </div>
        ))}
      </div>

      <button
        onClick={() => downloadReport({ input, mode, analysis })}
        disabled={!input.trim()}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-emerald-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-white disabled:opacity-50"
      >
        <Download className="h-4 w-4" />
        Export safety report
      </button>

      {!hasAnalyzed && (
        <p className="mt-3 text-center text-xs text-white/35">
          Run analysis to save this scan into history.
        </p>
      )}
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
    <section className="rounded-[2rem] border border-white/10 glass p-5 backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-2xl font-black text-white">
          <History className="h-6 w-6 text-cyan-200" />
          Scan history
        </h3>

        <button onClick={onClear} className="text-sm text-white/40 hover:text-white">
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
    <section className="rounded-[2rem] border border-white/10 glass p-5 backdrop-blur-xl">
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
          icon={<ShieldCheck className="h-5 w-5" />}
          title="Verify through official channels"
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
  icon: React.ReactNode;
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