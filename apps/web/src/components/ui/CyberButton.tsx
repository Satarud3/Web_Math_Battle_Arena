import type { ComponentPropsWithoutRef } from "react";

type CyberButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: "primary" | "ghost" | "danger";
};

export default function CyberButton({
  className = "",
  variant = "primary",
  ...props
}: CyberButtonProps) {
  const variants = {
    primary:
      "bg-gradient-to-r from-neon-blue to-neon-purple text-white shadow-[0_0_28px_rgba(59,130,246,0.35)] hover:shadow-[0_0_38px_rgba(6,182,212,0.45)]",
    ghost:
      "border border-border-soft bg-white/[0.04] text-slate-100 hover:border-neon-cyan/50 hover:bg-neon-cyan/10",
    danger:
      "border border-neon-red/40 bg-neon-red/10 text-red-200 hover:bg-neon-red/20",
  };

  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-extrabold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
