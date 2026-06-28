"use client";

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";

interface ThreeCanvasProps {
  children: React.ReactNode;
  className?: string;
  camera?: { position?: [number, number, number]; fov?: number };
}

function CanvasFallback() {
  return null;
}

export default function ThreeCanvas({
  children,
  className = "",
  camera = { position: [0, 0, 5], fov: 60 },
}: ThreeCanvasProps) {
  return (
    <div className={`pointer-events-none ${className}`}>
      <Canvas
        camera={camera}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        style={{ background: "transparent" }}
        resize={{ debounce: 200 }}
      >
        <Suspense fallback={<CanvasFallback />}>
          {children}
        </Suspense>
      </Canvas>
    </div>
  );
}
