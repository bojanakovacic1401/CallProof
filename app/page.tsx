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

import { demoCases, defaultDemoCase, simulatedAudioTranscript } from "@/lib/demoCases";
import { analyzeScamContent } from "@/lib/scamEngine";
import type { DemoCase, InputMode, ScanHistoryItem, ScamAnalysis } from "@/lib/types";

function getRiskColor(risk: string) {
  if (risk === "Critical") return "text-red-200 border-red-300/20 bg-red-300/10";
  if (risk === "High") return "text-orange-200 border-orange-300/20 bg-orange-300/10";
  if (risk === "Medium") return "text-yellow-200 border-yellow-300/20 bg-yellow-300/10";
  return "text-emerald-200 border-emerald-300/20 bg-emerald-300/10";
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
    title: analysis.attackType,
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
  const report = `CallProof Scam Analysis Report

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

Analyzed content:
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

    await new Promise((resolve) => setTimeout(resolve, 900));

    setHasAnalyzed(true);
    setHistory((prev) => [
      createHistoryItem({ mode, analysis }),
      ...prev,
    ].slice(0, 8));

    setIsAnalyzing(false);
  }

  function handleAudioUpload(file: File | null) {
    if (!file) return;

    setMode("audio");
    setAudioFileName(file.name);
    setSelectedDemoId("fake-bank-call");
    setHasAnalyzed(false);

    setInput(simulatedAudioTranscript);
  }

  const heroRisk = analysis.riskLevel;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050816] text-slate-50">
      <div className="radial-glow absolute inset-0" />
      <div className="cyber-grid absolute inset-0 opacity-80" />
      <div className="noise pointer-events-none absolute inset-0" />

      <div className="relative z-10 mx-auto w-full max-w-[1480px] px-5 py-6 lg:px-6">
        <nav className="mb-10 flex items-center justify-between rounded-full border border-cyan-300/15 bg-black/30 px-5 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-300/25 bg-cyan-300/10 text-cyan-200">
              <Shield className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm font-bold tracking-[0.35em] text-white">
                CALLPROOF
              </p>
              <p className="text-xs text-white/40">
                Scam call and message protection
              </p>
            </div>
          </div>

          <button
            onClick={runAnalysis}
            className="rounded-full bg-cyan-300 px-5 py-2 text-sm font-bold text-slate-950 transition hover:bg-white"
          >
            Analyze now
          </button>
        </nav>

        <section className="mb-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[2rem] border border-cyan-300/15 bg-black/35 p-8 backdrop-blur-xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-semibold text-cyan-200">
              <Radar className="h-4 w-4" />
              AI-assisted scam detection
            </div>

            <h1 className="max-w-4xl text-5xl font-black tracking-tight text-white md:text-7xl">
              Know if a call or message is{" "}
              <span className="text-cyan-300">safe</span> before you respond.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-white/55">
              CallProof analyzes suspicious messages, call transcripts, and uploaded
              audio to detect scam probability, manipulation tactics, red flags,
              and the safest next action.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                onClick={runAnalysis}
                className="rounded-full bg-white px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-200"
              >
                Run scam analysis
              </button>

              <button
                onClick={() => loadDemo(demoCases[0])}
                className="rounded-full border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-bold text-white transition hover:border-cyan-300/40"
              >
                Try fake bank call
              </button>
            </div>
          </div>

          <div className="grid gap-4">
            <div className={`rounded-[2rem] border p-6 backdrop-blur-xl ${getRiskColor(heroRisk)}`}>
              <p className="text-xs uppercase tracking-[0.22em] opacity-75">
                Scam probability
              </p>
              <p className="mt-3 text-6xl font-black">{analysis.scamProbability}%</p>
              <p className="mt-2 text-lg font-semibold">{analysis.riskLevel} risk</p>
              <p className="mt-4 text-sm leading-6 opacity-70">{analysis.summary}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <MiniStat label="Attack type" value={analysis.attackType} />
              <MiniStat label="Confidence" value={analysis.confidence} />
              <MiniStat label="Red flags" value={String(analysis.redFlags.length)} />
            </div>
          </div>
        </section>

        <section className="mb-8 rounded-[2rem] border border-cyan-300/15 bg-black/35 p-5 backdrop-blur-xl">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-cyan-200">
                Demo cases
              </p>
              <h2 className="mt-1 text-2xl font-bold text-white">
                Choose a suspicious call or message
              </h2>
            </div>

            <p className="text-sm text-white/45">
              {demoCases.length} realistic scenarios
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
                    : "border-white/10 bg-white/[0.03] hover:border-cyan-300/30"
                }`}
              >
                <p className="text-sm font-bold text-white">{demo.title}</p>
                <p className="mt-1 text-sm text-white/45">{demo.subtitle}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="mb-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] border border-cyan-300/15 bg-black/35 p-5 backdrop-blur-xl">
            <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-cyan-200">
                  Input
                </p>
                <h2 className="mt-1 text-2xl font-bold text-white">
                  Analyze a message, transcript, or audio
                </h2>
              </div>

              <label className="flex cursor-pointer items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-sm font-semibold text-amber-100">
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
                label="Audio Upload"
                onClick={() => setMode("audio")}
              />
            </div>

            {mode === "audio" && (
              <div className="mb-4 rounded-3xl border border-cyan-300/15 bg-cyan-300/10 p-4">
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-cyan-300/30 bg-black/25 p-6 text-center transition hover:border-cyan-300/60">
                  <Upload className="mb-3 h-6 w-6 text-cyan-200" />
                  <p className="font-semibold text-white">
                    Upload a call recording
                  </p>
                  <p className="mt-1 text-sm text-white/45">
                    MVP demo uses simulated transcription after upload.
                  </p>
                  <input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(event) =>
                      handleAudioUpload(event.target.files?.[0] || null)
                    }
                  />
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
              onChange={(event) => {
                setInput(event.target.value);
                setHasAnalyzed(false);
              }}
              rows={14}
              className="w-full resize-none rounded-3xl border border-white/10 bg-black/45 p-5 font-mono text-sm leading-6 text-white outline-none transition placeholder:text-white/25 focus:border-cyan-300/50"
              placeholder="Paste a suspicious message or call transcript here..."
            />

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={runAnalysis}
                disabled={isAnalyzing}
                className="rounded-full bg-cyan-300 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-white disabled:opacity-60"
              >
                {isAnalyzing ? "Analyzing..." : "Analyze content"}
              </button>

              <button
                onClick={() => {
                  setInput("");
                  setAudioFileName(null);
                  setHasAnalyzed(false);
                }}
                className="rounded-full border border-white/10 bg-white/[0.03] px-6 py-3 text-sm font-bold text-white transition hover:border-red-300/30"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <RiskPanel analysis={analysis} isAnalyzing={isAnalyzing} />

            <div className="grid gap-6 lg:grid-cols-2">
              <RedFlagsPanel analysis={analysis} />
              <TacticsPanel analysis={analysis} />
            </div>
          </div>
        </section>

        <section className="mb-8 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <EvidencePanel analysis={analysis} />

          <SafeActionPanel
            analysis={analysis}
            familyMode={familyMode}
            hasAnalyzed={hasAnalyzed}
            input={input}
            mode={mode}
            onExport={() => downloadReport({ input, mode, analysis })}
          />
        </section>

        <section className="mb-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <HistoryPanel history={history} onClear={() => setHistory([])} />
          <EducationPanel />
        </section>
      </div>
    </main>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/35 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-white/35">{label}</p>
      <p className="mt-2 text-sm font-bold text-white">{value}</p>
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
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold transition ${
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

function RiskPanel({
  analysis,
  isAnalyzing,
}: {
  analysis: ScamAnalysis;
  isAnalyzing: boolean;
}) {
  return (
    <div className="rounded-[2rem] border border-cyan-300/15 bg-black/35 p-5 backdrop-blur-xl">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-white">
            <ShieldAlert className="h-6 w-6 text-cyan-200" />
            Scam Risk Analysis
          </h2>
          <p className="mt-1 text-sm text-white/45">
            Probability score, attack classification, and explanation.
          </p>
        </div>

        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getRiskColor(analysis.riskLevel)}`}>
          {analysis.riskLevel}
        </span>
      </div>

      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between text-sm text-white/55">
          <span>Scam probability</span>
          <span>{analysis.scamProbability}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-cyan-300 transition-all duration-700"
            style={{ width: `${analysis.scamProbability}%` }}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-white/40">
            Attack type
          </p>
          <p className="mt-2 text-lg font-bold text-white">{analysis.attackType}</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-white/40">
            Confidence
          </p>
          <p className="mt-2 text-lg font-bold text-white">
            {isAnalyzing ? "Scanning..." : analysis.confidence}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
        <p className="mb-2 text-xs uppercase tracking-[0.18em] text-cyan-200">
          Explanation
        </p>
        <p className="text-sm leading-6 text-white/65">{analysis.summary}</p>
      </div>
    </div>
  );
}

function RedFlagsPanel({ analysis }: { analysis: ScamAnalysis }) {
  return (
    <div className="rounded-[2rem] border border-red-300/15 bg-black/35 p-5 backdrop-blur-xl">
      <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-white">
        <Siren className="h-5 w-5 text-red-300" />
        Red Flags
      </h3>

      <div className="space-y-3">
        {analysis.redFlags.length ? (
          analysis.redFlags.map((flag) => (
            <div key={flag} className="rounded-2xl border border-red-300/15 bg-red-300/10 p-3 text-sm text-red-100">
              {flag}
            </div>
          ))
        ) : (
          <p className="text-sm text-white/45">No strong red flags detected.</p>
        )}
      </div>
    </div>
  );
}

function TacticsPanel({ analysis }: { analysis: ScamAnalysis }) {
  return (
    <div className="rounded-[2rem] border border-amber-300/15 bg-black/35 p-5 backdrop-blur-xl">
      <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-white">
        <BellRing className="h-5 w-5 text-amber-300" />
        Manipulation Tactics
      </h3>

      <div className="flex flex-wrap gap-2">
        {analysis.tactics.length ? (
          analysis.tactics.map((tactic) => (
            <span
              key={tactic}
              className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-100"
            >
              {tactic}
            </span>
          ))
        ) : (
          <p className="text-sm text-white/45">No manipulation tactics detected.</p>
        )}
      </div>
    </div>
  );
}

function EvidencePanel({ analysis }: { analysis: ScamAnalysis }) {
  return (
    <div className="rounded-[2rem] border border-cyan-300/15 bg-black/35 p-5 backdrop-blur-xl">
      <h3 className="mb-4 flex items-center gap-2 text-2xl font-bold text-white">
        <ClipboardCheck className="h-6 w-6 text-cyan-200" />
        Evidence Highlights
      </h3>

      <div className="space-y-3">
        {analysis.evidence.length ? (
          analysis.evidence.map((item, index) => (
            <div key={`${item.text}-${index}`} className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <p className="font-mono text-sm text-cyan-100">“{item.text}”</p>
              <p className="mt-2 text-sm leading-6 text-white/50">{item.reason}</p>
            </div>
          ))
        ) : (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/45">
            No suspicious evidence highlighted yet.
          </div>
        )}
      </div>
    </div>
  );
}

function SafeActionPanel({
  analysis,
  familyMode,
  hasAnalyzed,
  input,
  mode,
  onExport,
}: {
  analysis: ScamAnalysis;
  familyMode: boolean;
  hasAnalyzed: boolean;
  input: string;
  mode: InputMode;
  onExport: () => void;
}) {
  return (
    <div className="rounded-[2rem] border border-emerald-300/15 bg-black/35 p-5 backdrop-blur-xl">
      <h3 className="mb-4 flex items-center gap-2 text-2xl font-bold text-white">
        <ShieldCheck className="h-6 w-6 text-emerald-300" />
        Safe Next Action
      </h3>

      <div className="mb-4 rounded-3xl border border-emerald-300/20 bg-emerald-300/10 p-4">
        <p className="mb-2 text-xs uppercase tracking-[0.2em] text-emerald-200">
          Recommended response
        </p>
        <p className="text-sm leading-6 text-white/75">{analysis.safeReply}</p>
      </div>

      {familyMode && (
        <div className="mb-4 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-4">
          <p className="mb-2 flex items-center gap-2 text-sm font-bold text-amber-100">
            <Users className="h-4 w-4" />
            Family Mode Advice
          </p>
          <p className="text-sm leading-6 text-white/75">
            {analysis.familyModeAdvice}
          </p>
        </div>
      )}

      <div className="mb-4 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
        <p className="mb-3 text-xs uppercase tracking-[0.2em] text-cyan-200">
          What to do now
        </p>

        <div className="space-y-2">
          {analysis.nextSteps.map((step) => (
            <div key={step} className="flex gap-2 text-sm text-white/65">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
              <span>{step}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onExport}
        disabled={!input.trim()}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-300 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-white disabled:opacity-50"
      >
        <Download className="h-4 w-4" />
        Export safety report
      </button>

      {!hasAnalyzed && (
        <p className="mt-3 text-center text-xs text-white/35">
          Run analysis to save this scan into history.
        </p>
      )}
    </div>
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
    <div className="rounded-[2rem] border border-cyan-300/15 bg-black/35 p-5 backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-2xl font-bold text-white">
          <History className="h-6 w-6 text-cyan-200" />
          Scan History
        </h3>

        <button onClick={onClear} className="text-sm text-white/40 hover:text-white">
          Clear
        </button>
      </div>

      <div className="space-y-3">
        {history.length ? (
          history.map((item) => (
            <div key={item.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-white">{item.attackType}</p>
                  <p className="mt-1 text-xs text-white/40">
                    {new Date(item.createdAt).toLocaleString()} • {item.mode}
                  </p>
                </div>

                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getRiskColor(item.riskLevel)}`}>
                  {item.score}%
                </span>
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/45">
            No scans yet. Run your first analysis.
          </p>
        )}
      </div>
    </div>
  );
}

function EducationPanel() {
  return (
    <div className="rounded-[2rem] border border-amber-300/15 bg-black/35 p-5 backdrop-blur-xl">
      <h3 className="mb-4 flex items-center gap-2 text-2xl font-bold text-white">
        <Sparkles className="h-6 w-6 text-amber-300" />
        Why this matters
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
          text="A bank, courier, or official organization will not ask you to read a one-time code over the phone."
        />
        <EducationCard
          icon={<ShieldCheck className="h-5 w-5" />}
          title="Verify through official channels"
          text="Hang up, close the message, and contact the organization using its official website or phone number."
        />
        <EducationCard
          icon={<Users className="h-5 w-5" />}
          title="Protect family members"
          text="Family Mode explains risks in simpler language for people who may be less comfortable with technology."
        />
      </div>
    </div>
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
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-300/10 text-amber-200">
        {icon}
      </div>
      <p className="font-bold text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-white/50">{text}</p>
    </div>
  );
}