"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, Text3D, Center } from "@react-three/drei";
import * as THREE from "three";

/* ── Floating Math Symbol ─────────────────────────────── */
function MathSymbol({
  symbol,
  position,
  color,
  speed,
  rotationAxis,
}: {
  symbol: string;
  position: [number, number, number];
  color: string;
  speed: number;
  rotationAxis: [number, number, number];
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x += delta * speed * rotationAxis[0];
    meshRef.current.rotation.y += delta * speed * rotationAxis[1];
    meshRef.current.rotation.z += delta * speed * rotationAxis[2];
  });

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={1.2} floatingRange={[-0.3, 0.3]}>
      <mesh ref={meshRef} position={position}>
        <torusGeometry args={[0.4, 0.12, 16, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.6}
          metalness={0.8}
          roughness={0.2}
          transparent
          opacity={0.85}
        />
      </mesh>
      {/* Glow ring around symbol */}
      <mesh position={position}>
        <ringGeometry args={[0.55, 0.62, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>
    </Float>
  );
}

/* ── Cyber Grid Floor ─────────────────────────────────── */
function CyberGrid() {
  const gridRef = useRef<THREE.GridHelper>(null);

  useFrame((_, delta) => {
    if (!gridRef.current) return;
    gridRef.current.position.z += delta * 0.3;
    if (gridRef.current.position.z > 1) {
      gridRef.current.position.z = 0;
    }
  });

  return (
    <gridHelper
      ref={gridRef}
      args={[40, 40, "#00F0FF", "#00F0FF"]}
      position={[0, -2.5, 0]}
      rotation={[0, 0, 0]}
      material-opacity={0.08}
      material-transparent={true}
    />
  );
}

/* ── Particle Field ───────────────────────────────────── */
function ParticleField({ count = 80 }: { count?: number }) {
  const points = useRef<THREE.Points>(null);

  const [positions, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8;
      sz[i] = Math.random() * 2 + 0.5;
    }
    return [pos, sz];
  }, [count]);

  useFrame((state) => {
    if (!points.current) return;
    const geo = points.current.geometry;
    const posAttr = geo.getAttribute("position");
    const time = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const baseY = positions[i * 3 + 1];
      posAttr.setY(i, baseY + Math.sin(time * 0.5 + i * 0.3) * 0.15);
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[sizes, 1]}
          count={count}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#00F0FF"
        transparent
        opacity={0.5}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

/* ── Main Scene Export ────────────────────────────────── */
export default function FloatingMathScene() {
  const symbols = useMemo(
    () => [
      { symbol: "Σ", position: [-2.5, 1.0, 0] as [number, number, number], color: "#00F0FF", speed: 0.4, rotationAxis: [0.3, 1, 0.2] as [number, number, number] },
      { symbol: "π", position: [2.2, 0.5, -1] as [number, number, number], color: "#B026FF", speed: 0.3, rotationAxis: [0.5, 0.3, 1] as [number, number, number] },
      { symbol: "∫", position: [0, 1.5, -0.5] as [number, number, number], color: "#FFB800", speed: 0.5, rotationAxis: [1, 0.5, 0.3] as [number, number, number] },
      { symbol: "∞", position: [-1.2, -0.5, 0.5] as [number, number, number], color: "#00FF66", speed: 0.35, rotationAxis: [0.2, 1, 0.5] as [number, number, number] },
      { symbol: "Δ", position: [1.5, -0.3, 1] as [number, number, number], color: "#00F0FF", speed: 0.45, rotationAxis: [0.7, 0.3, 0.8] as [number, number, number] },
    ],
    []
  );

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={0.8} color="#00F0FF" />
      <pointLight position={[-5, 3, -3]} intensity={0.5} color="#B026FF" />

      {symbols.map((s, i) => (
        <MathSymbol key={i} {...s} />
      ))}

      <CyberGrid />
      <ParticleField count={100} />

      {/* Fog for depth */}
      <fog attach="fog" args={["#050816", 5, 18]} />
    </>
  );
}
