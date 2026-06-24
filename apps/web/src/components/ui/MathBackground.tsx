export default function MathBackground() {
const equations = ["Σ", "π", "∫", "Δ", "√x", "f(x)", "dx", "A/B", "x+y", "2n"];

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-bg-main">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.18),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(139,92,246,0.18),transparent_28%),linear-gradient(180deg,#050816,#030712)]" />
      <div className="math-grid absolute inset-0 opacity-35" />
      <div className="absolute left-1/2 top-20 h-72 w-72 -translate-x-1/2 rounded-full border border-neon-cyan/20 bg-neon-cyan/5 blur-sm" />
      <div className="absolute inset-0">
        {equations.map((item, index) => (
          <span
            key={item}
            className="floating-equation absolute rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-neon-cyan/55"
            style={{
              left: `${8 + index * 12}%`,
              top: `${16 + (index % 4) * 18}%`,
              animationDelay: `${index * 0.7}s`,
            }}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
