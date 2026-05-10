import type { ReactNode } from "react";

export function Card({
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
          ? "border-red-400/35 bg-[linear-gradient(135deg,rgba(88,18,30,0.92),rgba(28,12,24,0.88)),radial-gradient(circle_at_84%_25%,rgba(239,68,68,0.34),transparent_34%)] text-white"
          : "border-[var(--line)] bg-[linear-gradient(135deg,var(--panel-strong),var(--panel)),radial-gradient(circle_at_top_right,rgba(34,211,238,0.055),transparent_34%)]"
      } ${className}`}
    >
      {children}
    </section>
  );
}