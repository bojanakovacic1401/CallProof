import {
  AudioLines,
  Bell,
  FileText,
  LayoutDashboard,
  Lock,
  MessageSquareText,
  Phone,
  Settings,
  Shield,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

function LogoMark() {
  return (
    <div className="relative flex h-11 w-11 items-center justify-center rounded-[14px] border border-red-400/35 bg-red-500/10 text-red-300 shadow-[0_0_28px_rgba(239,68,68,0.2)]">
      <Shield className="h-6 w-6" />
      <div className="absolute inset-1 rounded-[11px] border border-red-400/10" />
    </div>
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

export function Sidebar() {
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
                ? "bg-red-500/15 text-red-500 shadow-[inset_0_0_0_1px_rgba(248,113,113,0.25)]"
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