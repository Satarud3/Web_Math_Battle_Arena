import React from "react";
import { Lock } from "lucide-react";

function StubWrapper({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-8 rounded-2xl border border-white/5 bg-bg-surface/30 text-center flex flex-col items-center justify-center min-h-[200px] font-ui">
      <Lock className="w-8 h-8 text-neon-blue mb-2 animate-pulse" />
      <h3 className="text-sm font-bold text-white uppercase tracking-wider font-heading">{title}</h3>
      <p className="text-xs text-slate-500 mt-1">{description}</p>
    </div>
  );
}

export function ArrangeFormula() {
  return <StubWrapper title="Arrange Formula" description="Tipe soal menyusun rumus/formula matematika akan segera hadir." />;
}

export function BuildEquation() {
  return <StubWrapper title="Build Equation" description="Tipe soal membangun persamaan matematika akan segera hadir." />;
}

export function NumberLine() {
  return <StubWrapper title="Number Line" description="Tipe soal garis bilangan interaktif akan segera hadir." />;
}

export function CoordinatePlane() {
  return <StubWrapper title="Coordinate Plane" description="Tipe soal koordinat kartesius akan segera hadir." />;
}

export function GeometryBuilder() {
  return <StubWrapper title="Geometry Builder" description="Tipe soal membangun bangun geometri akan segera hadir." />;
}

export function FunctionGraph() {
  return <StubWrapper title="Function Graph" description="Tipe soal grafik fungsi interaktif akan segera hadir." />;
}

export function SwipeAnswer() {
  return <StubWrapper title="Swipe Answer" description="Tipe soal geser cepat jawaban akan segera hadir." />;
}

export function Puzzle() {
  return <StubWrapper title="Math Puzzle" description="Tipe soal teka-teki logika matematika akan segera hadir." />;
}
