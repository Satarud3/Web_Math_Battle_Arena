import type { ComponentPropsWithoutRef } from "react";

export default function GlassCard({
  className = "",
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={`glass-panel rounded-2xl border border-border-soft bg-bg-glass shadow-[0_24px_80px_rgba(0,0,0,0.28)] ${className}`}
      {...props}
    />
  );
}
