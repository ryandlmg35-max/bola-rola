import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Hero 3D: globo wireframe azul (o império global) + a Space Tower (torre de
 * Brasília/NY) com bordas luminosas + anel de órbita + campo de estrelas.
 * Ambient: só roda no ClientOnly do index.tsx — SSR nunca monta o Canvas.
 */

function Estrelas() {
  const geo = useMemo(() => {
    const N = 350;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      // casca esférica distante, distribuição uniforme por inversa de seno
      const y = Math.random() * 2 - 1;
      const r = 14 + Math.random() * 6;
      const theta = Math.random() * Math.PI * 2;
      const s = Math.sqrt(1 - y * y);
      pos[i * 3] = r * s * Math.cos(theta);
      pos[i * 3 + 1] = r * y;
      pos[i * 3 + 2] = r * s * Math.sin(theta);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  const ref = useRef<THREE.Points>(null);
  useFrame((_, d) => {
    if (ref.current) ref.current.rotation.y += d * 0.01;
  });

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial size={0.07} color="#93c5fd" transparent opacity={0.8} sizeAttenuation />
    </points>
  );
}

function Globo() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, d) => {
    if (ref.current) {
      ref.current.rotation.y += d * 0.12;
      ref.current.rotation.x = 0.25;
    }
  });
  return (
    <mesh ref={ref} position={[1.6, 0, 0]}>
      <sphereGeometry args={[1.9, 36, 24]} />
      <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.28} />
      {/* núcleo brilhante */}
      <mesh>
        <sphereGeometry args={[0.35, 16, 12]} />
        <meshBasicMaterial color="#60a5fa" transparent opacity={0.55} />
      </mesh>
      {/* anel de órbita */}
      <mesh rotation={[Math.PI / 2.4, 0, 0.4]}>
        <torusGeometry args={[2.55, 0.012, 8, 90]} />
        <meshBasicMaterial color="#93c5fd" transparent opacity={0.5} />
      </mesh>
      {/* satélite em órbita */}
      <Satelite />
    </mesh>
  );
}

function Satelite() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      const t = clock.elapsedTime * 0.55;
      ref.current.position.set(Math.cos(t) * 2.55, Math.sin(t) * 0.9, Math.sin(t) * 2.4);
    }
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.06, 8, 8]} />
      <meshBasicMaterial color="#e2e8f0" />
    </mesh>
  );
}

function Torre() {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, d) => {
    if (ref.current) ref.current.rotation.y += d * 0.2;
  });
  // caixas empilhadas com arestas luminosas — torre icônica do império
  const andares = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => ({
        y: -1.9 + i * 0.46,
        w: 0.75 - i * 0.055,
        h: 0.42,
      })),
    [],
  );
  return (
    <group ref={ref} position={[-3.3, 0.1, 0]}>
      {andares.map((a, i) => (
        <group key={i} position={[0, a.y, 0]}>
          <mesh>
            <boxGeometry args={[a.w, a.h, a.w]} />
            <meshBasicMaterial color="#1e3a8a" transparent opacity={0.35} />
          </mesh>
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(a.w, a.h, a.w)]} />
            <lineBasicMaterial color={i === 8 ? "#93c5fd" : "#3b82f6"} transparent opacity={0.85} />
          </lineSegments>
        </group>
      ))}
      {/* beacon no topo */}
      <mesh position={[0, 2.35, 0]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshBasicMaterial color="#e2e8f0" />
      </mesh>
    </group>
  );
}

export function Cena3D() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <Canvas
        camera={{ position: [0, 0.4, 8.5], fov: 50 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <Estrelas />
        <Globo />
        <Torre />
      </Canvas>
    </div>
  );
}
