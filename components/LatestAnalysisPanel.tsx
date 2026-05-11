import {
  AlertTriangle,
  ShieldCheck,
  Skull,
} from "lucide-react";

import type { ScamAnalysis } from "@/lib/types";
import type { RiskTone } from "./types";
import { Card } from "./Card";

export function LatestAnalysisPanel({
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
      ? "AI Review"
      : apiStatus === "fallback"
        ? "Rule Fallback"
        : apiStatus === "error"
          ? "Offline Fallback"
          : "Local Preview";

  const riskTone: RiskTone =
    analysis.scamProbability >= 80
      ? "danger"
      : analysis.scamProbability >= 30
        ? "warning"
        : "safe";

  return (
    <Card danger={riskTone === "danger"} className="h-full">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.34em] text-cyan-300">
            Latest Analysis
          </p>
          <h2 className="mt-1 text-xl font-semibold text-[var(--fg)]">
            Scam risk decision
          </h2>
        </div>

        <button
          onClick={onExport}
          className="rounded-xl border border-[var(--line)] bg-white/[0.06] px-3 py-2 text-xs font-medium text-[var(--fg)]"
        >
          View Report
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_148px]">
        <div>
          <div className="flex items-center gap-4">
            <p
              className={`text-6xl font-bold tracking-tight ${
                riskTone === "safe"
                  ? "text-emerald-400"
                  : riskTone === "warning"
                    ? "text-amber-400"
                    : "text-red-400"
              }`}
            >
              {isAnalyzing ? "..." : `${analysis.scamProbability}%`}
            </p>

            <RiskBadge tone={riskTone} label={`${analysis.riskLevel} Risk`} />
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <AnalysisMeta
              label="Scan probability"
              value={`${analysis.scamProbability}%`}
            />
            <AnalysisMeta label="Type" value={analysis.attackType} />
            <AnalysisMeta label="Source" value={statusText} />
            <AnalysisMeta label="Confidence" value={analysis.confidence} />
          </div>
        </div>

        <RadarCircle tone={riskTone} />
      </div>

      <div className="mt-4">
        <p className="mb-2 text-sm font-medium text-[var(--fg)]">
          Key red flags
        </p>

        <div className="space-y-1.5">
          {(analysis.redFlags.length
            ? analysis.redFlags
            : riskTone === "safe"
              ? ["No strong red flags detected"]
              : ["Review recommended"]
          )
            .slice(0, 4)
            .map((flag) => (
              <div
                key={flag}
                className="flex items-center gap-2 text-sm text-[var(--muted)]"
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    riskTone === "safe"
                      ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]"
                      : riskTone === "warning"
                        ? "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]"
                        : "bg-red-400 shadow-[0_0_10px_rgba(239,68,68,0.8)]"
                  }`}
                />
                {flag}
              </div>
            ))}
        </div>
      </div>
    </Card>
  );
}

function RiskBadge({
  tone,
  label,
}: {
  tone: RiskTone;
  label: string;
}) {
  if (tone === "safe") {
    return (
      <div className="rounded-xl border border-emerald-300/30 bg-emerald-300/10 px-4 py-3 text-emerald-300">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          <span className="text-sm font-semibold">Safe</span>
        </div>
      </div>
    );
  }

  if (tone === "warning") {
    return (
      <div className="rounded-xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-amber-300">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          <span className="text-sm font-semibold">Needs review</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-red-300/25 bg-red-300/10 px-4 py-3 text-red-100">
      <div className="flex items-center gap-2">
        <Skull className="h-5 w-5" />
        <span className="text-sm font-semibold">{label}</span>
      </div>
    </div>
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

function RadarCircle({ tone }: { tone: RiskTone }) {
  const color =
    tone === "safe" ? "emerald" : tone === "warning" ? "amber" : "red";

  const icon =
    tone === "safe" ? (
      <ShieldCheck className="h-7 w-7" />
    ) : tone === "warning" ? (
      <AlertTriangle className="h-7 w-7" />
    ) : (
      <Skull className="h-7 w-7" />
    );

  const classes = {
    emerald: {
      border: "border-emerald-400/25",
      bg: "bg-emerald-500/5",
      line: "rgba(52,211,153,0.16)",
      dot: "bg-emerald-400 shadow-[0_0_28px_rgba(52,211,153,0.95)]",
      icon: "text-emerald-300",
      pulse: "bg-emerald-400/10",
    },
    amber: {
      border: "border-amber-400/25",
      bg: "bg-amber-500/5",
      line: "rgba(251,191,36,0.16)",
      dot: "bg-amber-400 shadow-[0_0_28px_rgba(251,191,36,0.95)]",
      icon: "text-amber-300",
      pulse: "bg-amber-400/10",
    },
    red: {
      border: "border-red-400/25",
      bg: "bg-red-500/5",
      line: "rgba(239,68,68,0.16)",
      dot: "bg-red-400 shadow-[0_0_28px_rgba(239,68,68,0.95)]",
      icon: "text-red-300",
      pulse: "bg-red-400/10",
    },
  }[color];

  return (
    <div
      className={`relative flex h-[148px] w-[148px] items-center justify-center overflow-hidden rounded-full border ${classes.border} ${classes.bg}`}
    >
      <div
        className="absolute inset-0 bg-[size:14px_14px]"
        style={{
          backgroundImage: `linear-gradient(${classes.line} 1px, transparent 1px), linear-gradient(90deg, ${classes.line} 1px, transparent 1px)`,
        }}
      />

      <div
        className={`absolute h-[118px] w-[118px] rounded-full border ${classes.border}`}
      />
      <div
        className={`absolute h-[82px] w-[82px] rounded-full border ${classes.border}`}
      />
      <div
        className={`absolute h-[46px] w-[46px] rounded-full border ${classes.border}`}
      />

      <div className={`absolute h-[1px] w-full ${classes.border} border-t`} />
      <div className={`absolute h-full w-[1px] ${classes.border} border-l`} />

      <div className={`absolute h-4 w-4 rounded-full ${classes.dot}`} />
      <div
        className={`absolute h-28 w-28 animate-pulse rounded-full ${classes.pulse}`}
      />

      <div
        className={`relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl border ${classes.border} bg-black/20 ${classes.icon}`}
      >
        {icon}
      </div>
    </div>
  );
}