import type { ReactNode } from "react";
import {
  AlertTriangle,
  BadgeAlert,
  Ban,
  BellRing,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Download,
  Globe,
  History,
  MessageSquareText,
  Phone,
  ShieldCheck,
  Siren,
  Sparkles,
  Users,
} from "lucide-react";

import type { DemoCase, InputMode, ScamAnalysis, ScanHistoryItem } from "@/lib/types";
import { demoCases } from "@/lib/demoCases";
import { Card } from "./Card";

export function getRiskStyle(risk: string) {
  if (risk === "Critical") return "border-red-400/40 bg-red-500/10 text-red-100";
  if (risk === "High") return "border-orange-400/40 bg-orange-500/10 text-orange-100";
  if (risk === "Medium") return "border-amber-400/40 bg-amber-500/10 text-amber-100";
  return "border-emerald-400/40 bg-emerald-500/10 text-emerald-100";
}

export function RiskScoreCard({ analysis }: { analysis: ScamAnalysis }) {
  const danger = analysis.scamProbability >= 80;

  return (
  <Card className="h-full">
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
          <p
            className={
              danger
                ? "text-lg font-semibold text-red-300"
                : "text-lg font-semibold text-cyan-300"
            }
          >
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

export function MetricCard({
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
    <Card className="h-full">
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
              tone === "red"
                ? "bg-red-400/12 text-red-300"
                : "bg-cyan-300/12 text-cyan-300"
            }`}
          >
            <Users className="h-8 w-8" />
          </div>
        )}
      </div>
    </Card>
  );
}

export function ProtectionLevelCard() {
  return (
  <Card className="h-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--fg)]">
            Protection Level
          </p>
          <p className="mt-4 text-xl font-semibold text-emerald-300">
            Maximum
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            All systems active
          </p>
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

export function RecentAlertsPanel() {
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
    <Card danger className="h-full">
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
              <p className="truncate text-sm font-medium text-white">
                {alert.title}
              </p>
              <p className="mt-0.5 truncate text-xs text-white/45">
                {alert.detail}
              </p>
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

export function DemoCasesPanel({
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
              <p className="text-sm font-medium text-[var(--fg)]">
                {demo.title}
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {demo.subtitle}
              </p>
            </div>

            <ChevronRight className="h-4 w-4 shrink-0 text-[var(--muted2)]" />
          </button>
        ))}
      </div>
    </Card>
  );
}

export function SignalPanel({
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
      ? "border-red-300/30 bg-red-500/10 text-[var(--fg)]"
      : "border-amber-300/30 bg-amber-400/12 text-[var(--fg)]";

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

export function SafeReplyPanel({
  analysis,
  familyMode,
  hasAnalyzed,
}: {
  analysis: ScamAnalysis;
  familyMode: boolean;
  hasAnalyzed: boolean;
}) {
  return (
    <section className="rounded-[18px] border border-emerald-300/25 bg-emerald-400/12 p-4 shadow-[0_18px_60px_var(--shadow)] backdrop-blur-xl">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--fg)]">
        <ShieldCheck className="h-5 w-5 text-emerald-300" />
        Safe action
      </h3>

      <p className="text-sm leading-6 text-[var(--muted)]">
        {analysis.safeReply}
      </p>

      {familyMode && (
        <div className="mt-4 rounded-xl border border-amber-300/35 bg-amber-300/15 p-3">
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

export function EvidencePanel({ analysis }: { analysis: ScamAnalysis }) {
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

export function NextStepsPanel({
  analysis,
  input,
  mode,
  aiEnabled,
  onExport,
}: {
  analysis: ScamAnalysis;
  input: string;
  mode: InputMode;
  aiEnabled: boolean;
  onExport: () => void;
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
        onClick={onExport}
        disabled={!input.trim()}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white disabled:opacity-50"
      >
        <Download className="h-4 w-4" />
        Export safety report
      </button>
    </Card>
  );
}

export function HistoryPanel({
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
                  <p className="font-medium text-[var(--fg)]">
                    {item.attackType}
                  </p>
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

export function EducationPanel() {
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