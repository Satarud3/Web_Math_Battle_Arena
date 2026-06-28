"use client";

import React, { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/* ── Core Energy Sphere ───────────────────────────────── */
function CoreSphere() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    meshRef.current.rotation.y = t * 0.2;
    meshRef.current.rotation.x = Math.sin(t * 0.3) * 0.1;
    const scale = 1 + Math.sin(t * 1.5) * 0.03;
    meshRef.current.scale.setScalar(scale);
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1, 3]} />
      <meshStandardMaterial
        color="#00F0FF"
        emissive="#00F0FF"
        emissiveIntensity={0.4}
        wireframe
        transparent
        opacity={0.35}
      />
    </mesh>
  );
}

/* ── Inner Glow Core ──────────────────────────────────── */
function InnerGlow() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    const scale = 0.55 + Math.sin(t * 2) * 0.05;
    meshRef.current.scale.setScalar(scale);
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial color="#B026FF" transparent opacity={0.12} />
    </mesh>
  );
}

/* ── Orbiting Particles ───────────────────────────────── */
function OrbitingParticles({ count = 120 }: { count?: number }) {
  const points = useRef<THREE.Points>(null);
  const { pointer } = useThree();

  const initialPositions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 1.2 + Math.random() * 0.6;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, [count]);

  const velocities = useMemo(() => {
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      vel[i * 3] = (Math.random() - 0.5) * 0.01;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.01;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
    }
    return vel;
  }, [count]);

  useFrame((state) => {
    if (!points.current) return;
    const geo = points.current.geometry;
    const posAttr = geo.getAttribute("position");
    const time = state.clock.elapsedTime;

    // Mouse influence (subtle pointer proximity effect)
    const mouseX = pointer.x * 0.5;
    const mouseY = pointer.y * 0.5;

    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      const iy = i * 3 + 1;
      const iz = i * 3 + 2;

      // Orbital rotation
      const baseX = initialPositions[ix];
      const baseY = initialPositions[iy];
      const baseZ = initialPositions[iz];

      const angle = time * 0.3 + i * 0.02;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      let x = baseX * cosA - baseZ * sinA;
      let y = baseY + Math.sin(time * 0.5 + i * 0.1) * 0.08;
      let z = baseX * sinA + baseZ * cosA;

      // Subtle mouse repulsion
      const dx = x - mouseX;
      const dy = y - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1.5) {
        const force = (1.5 - dist) * 0.08;
        x += (dx / dist) * force;
        y += (dy / dist) * force;
      }

      posAttr.setXYZ(i, x, y, z);
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[initialPositions.slice(), 3]}
          count={count}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color="#00F0FF"
        transparent
        opacity={0.7}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ── Orbiting Rings ───────────────────────────────────── */
function OrbitRing({
  radius,
  color,
  speed,
  tilt,
}: {
  radius: number;
  color: string;
  speed: number;
  tilt: [number, number, number];
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.z = state.clock.elapsedTime * speed;
  });

  return (
    <mesh ref={ref} rotation={tilt}>
      <torusGeometry args={[radius, 0.008, 8, 64]} />
      <meshBasicMaterial color={color} transparent opacity={0.25} />
    </mesh>
  );
}

/* ── Main Scene Export ────────────────────────────────── */
export default function EnergyCoreSphereScene() {
  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[3, 3, 3]} intensity={0.6} color="#00F0FF" />
      <pointLight position={[-3, -2, 2]} intensity={0.4} color="#B026FF" />

      <CoreSphere />
      <InnerGlow />
      <OrbitingParticles count={150} />

      <OrbitRing radius={1.6} color="#00F0FF" speed={0.15} tilt={[Math.PI / 4, 0, 0]} />
      <OrbitRing radius={1.9} color="#B026FF" speed={-0.1} tilt={[Math.PI / 3, Math.PI / 6, 0]} />
      <OrbitRing radius={2.2} color="#FFB800" speed={0.08} tilt={[Math.PI / 5, 0, Math.PI / 4]} />
    </>
  );
}
