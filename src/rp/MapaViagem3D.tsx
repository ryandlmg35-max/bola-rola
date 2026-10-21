import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { LocalViagem } from "./viagens";

/**
 * Mini mapa 3D de viagem — Terra real, rota e marcadores. Monta só no dialog
 * de deslocamento; ao fechar, o Canvas inteiro sai da árvore.
 */

function paraV3(lat: number, lon: number, r: number): THREE.Vector3 {
  const la = (lat * Math.PI) / 180;
  const lo = (lon * Math.PI) / 180;
  return new THREE.Vector3(
    r * Math.cos(la) * Math.sin(lo),
    r * Math.sin(la),
    r * Math.cos(la) * Math.cos(lo),
  );
}

/** 24 fps basta pro trajeto curto; pausa quando a aba fica oculta. */
function Ticker({ fps = 24 }: { fps?: number }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    let timer = 0;
    let ligado = true;
    const passo = () => {
      if (!ligado) return;
      invalidate();
      timer = window.setTimeout(passo, 1000 / fps);
    };
    const visibilidade = () => {
      if (document.hidden) {
        ligado = false;
        window.clearTimeout(timer);
        return;
      }
      if (!ligado) {
        ligado = true;
        passo();
      }
    };
    passo();
    document.addEventListener("visibilitychange", visibilidade);
    return () => {
      ligado = false;
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", visibilidade);
    };
  }, [invalidate, fps]);
  return null;
}

function Terra() {
  const textura = useLoader(THREE.TextureLoader, "/textures/earth.jpg");
  useMemo(() => {
    textura.colorSpace = THREE.SRGBColorSpace;
    textura.anisotropy = 4;
  }, [textura]);
  return (
    <mesh rotation={[0, -Math.PI / 2, 0]}>
      <sphereGeometry args={[2, 56, 36]} />
      <meshStandardMaterial map={textura} roughness={0.92} metalness={0.02} />
    </mesh>
  );
}

function Estrelas() {
  const geo = useMemo(() => {
    const N = 180;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const y = Math.random() * 2 - 1;
      const r = 9 + Math.random() * 5;
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
  return (
    <points geometry={geo}>
      <pointsMaterial size={0.05} color="#93c5fd" transparent opacity={0.7} sizeAttenuation />
    </points>
  );
}

function Marcador({ local, cor }: { local: LocalViagem; cor: string }) {
  const pos = useMemo(() => paraV3(local.lat, local.lon, 2.04), [local.lat, local.lon]);
  return (
    <group position={pos}>
      <mesh>
        <sphereGeometry args={[0.065, 12, 12]} />
        <meshBasicMaterial color={cor} />
      </mesh>
      <mesh>
        <ringGeometry args={[0.09, 0.13, 24]} />
        <meshBasicMaterial color={cor} transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function Arco({
  origem,
  destino,
  viajando,
}: {
  origem: LocalViagem;
  destino: LocalViagem;
  viajando: boolean;
}) {
  const { curva, tubo } = useMemo(() => {
    const a = paraV3(origem.lat, origem.lon, 2.05);
    const b = paraV3(destino.lat, destino.lon, 2.05);
    const dist = a.distanceTo(b);
    const altura = 2.55 + Math.max(0, 0.35 - dist) * 1.6;
    const meio = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(altura);
    const c = new THREE.QuadraticBezierCurve3(a, meio, b);
    const g = new THREE.TubeGeometry(c, 64, 0.012, 6, false);
    return { curva: c, tubo: g };
  }, [origem.lat, origem.lon, destino.lat, destino.lon]);

  const viajante = useRef<THREE.Mesh>(null);
  const inicio = useRef<number | null>(null);
  useEffect(() => {
    inicio.current = null;
  }, [viajando, curva]);

  useFrame(({ clock }) => {
    const m = viajante.current;
    if (!m) return;
    if (!viajando) {
      m.visible = false;
      return;
    }
    m.visible = true;
    if (inicio.current === null) inicio.current = clock.elapsedTime;
    const t = Math.min(1, (clock.elapsedTime - inicio.current) / 2.3);
    m.position.copy(curva.getPoint(t));
  });

  return (
    <group>
      <mesh geometry={tubo}>
        <meshBasicMaterial color="#fde68a" transparent opacity={0.95} />
      </mesh>
      <mesh ref={viajante} visible={false}>
        <sphereGeometry args={[0.055, 10, 10]} />
        <meshBasicMaterial color="#fef3c7" />
      </mesh>
    </group>
  );
}

function Mundo({
  origem,
  destino,
  viajando,
}: {
  origem: LocalViagem;
  destino: LocalViagem;
  viajando: boolean;
}) {
  const grupo = useRef<THREE.Group>(null);
  const rot = useMemo(() => {
    const lat = ((origem.lat + destino.lat) / 2) * (Math.PI / 180);
    const lon = ((origem.lon + destino.lon) / 2) * (Math.PI / 180);
    return { x: lat * 0.7, y: -lon };
  }, [origem.lat, origem.lon, destino.lat, destino.lon]);

  useFrame((_, d) => {
    const g = grupo.current;
    if (!g) return;
    const k = Math.min(1, d * 2.4);
    g.rotation.x += (rot.x - g.rotation.x) * k;
    let dy = rot.y - g.rotation.y;
    while (dy > Math.PI) dy -= Math.PI * 2;
    while (dy < -Math.PI) dy += Math.PI * 2;
    g.rotation.y += dy * k;
  });

  return (
    <group ref={grupo}>
      <Terra />
      <mesh>
        <sphereGeometry args={[2.09, 40, 26]} />
        <meshBasicMaterial color="#60a5fa" transparent opacity={0.05} side={THREE.BackSide} />
      </mesh>
      <Arco origem={origem} destino={destino} viajando={viajando} />
      <Marcador local={origem} cor="#60a5fa" />
      <Marcador local={destino} cor="#facc15" />
    </group>
  );
}

export function MapaViagem3D({
  origem,
  destino,
  viajando,
}: {
  origem: LocalViagem;
  destino: LocalViagem;
  viajando: boolean;
}) {
  return (
    <Canvas
      dpr={1}
      camera={{ position: [0, 0.5, 6.2], fov: 38 }}
      gl={{ antialias: false, alpha: true, powerPreference: "low-power" }}
      frameloop="demand"
      className="h-full w-full"
    >
      <Ticker />
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 2.5, 4]} intensity={1.9} />
      <Suspense fallback={null}>
        <Estrelas />
        <Mundo origem={origem} destino={destino} viajando={viajando} />
      </Suspense>
    </Canvas>
  );
}
