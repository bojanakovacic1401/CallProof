import { Bell, Moon, Search, Sun } from "lucide-react";
import type { ThemeMode } from "./types";

export function TopBar({
  theme,
  setTheme,
}: {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--sidebar)]/95 px-5 py-3.5 backdrop-blur-xl lg:px-6">
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
            <p className="text-sm font-medium text-[var(--fg)]">
              Protected User
            </p>
            <p className="text-xs text-cyan-300/80">Premium Plan</p>
          </div>
        </div>
      </div>
    </header>
  );
}