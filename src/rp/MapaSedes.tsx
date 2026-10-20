import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SEDES, sedePorId, totalQuadro, type Sede } from "./sedes";

/** lat/lon graus → posição no globo raio r (0°N 0°E fica virado pra câmera). */
function paraV3(lat: number, lon: number, r: number): THREE.Vector3 {
  const la = (lat * Math.PI) / 180;
  const lo = (lon * Math.PI) / 180;
  return new THREE.Vector3(
    r * Math.cos(la) * Math.sin(lo),
    r * Math.sin(la),
    r * Math.cos(la) * Math.cos(lo),
  );
}

function Estrelas() {
  const geo = useMemo(() => {
    const N = 260;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const y = Math.random() * 2 - 1;
      const r = 10 + Math.random() * 6;
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
      <pointsMaterial size={0.06} color="#93c5fd" transparent opacity={0.7} sizeAttenuation />
    </points>
  );
}

function Pin({
  sede,
  ativo,
  onSelecionar,
}: {
  sede: Sede;
  ativo: boolean;
  onSelecionar: (id: string) => void;
}) {
  const pos = useMemo(() => paraV3(sede.lat, sede.lon, 2.0), [sede]);
  const quaternion = useMemo(() => {
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pos.clone().normalize());
    return q;
  }, [pos]);
  const anelRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (anelRef.current && ativo) {
      const p = 1 + 0.3 * Math.sin(clock.elapsedTime * 5);
      anelRef.current.scale.setScalar(p);
    }
  });

  const cor = ativo ? "#f8fafc" : sede.id === "tower" ? "#facc15" : "#60a5fa";
  return (
    <group position={pos} quaternion={quaternion}>
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onSelecionar(sede.id);
        }}
      >
        <sphereGeometry args={[ativo ? 0.08 : 0.05, 10, 10]} />
        <meshBasicMaterial color={cor} />
      </mesh>
      {ativo && (
        <mesh ref={anelRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
          <ringGeometry args={[0.11, 0.15, 28]} />
          <meshBasicMaterial color="#93c5fd" transparent opacity={0.85} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

function Globo({
  selecionado,
  onSelecionar,
}: {
  selecionado: string;
  onSelecionar: (id: string) => void;
}) {
  const grupo = useRef<THREE.Group>(null);

  // rotação alvo que coloca a sede selecionada de frente pra câmera
  const alvo = useMemo(() => {
    const s = sedePorId(selecionado) ?? SEDES[0];
    return { x: (s.lat * Math.PI) / 180, y: -(s.lon * Math.PI) / 180 };
  }, [selecionado]);

  useFrame((_, d) => {
    const g = grupo.current;
    if (!g) return;
    const k = Math.min(1, d * 2.2);
    // caminho curto no eixo Y (não fica girando o mundo inteiro pra cruzar a linha de data)
    let dy = alvo.y - g.rotation.y;
    while (dy > Math.PI) dy -= Math.PI * 2;
    while (dy < -Math.PI) dy += Math.PI * 2;
    g.rotation.x += (alvo.x - g.rotation.x) * k;
    g.rotation.y += dy * k;
  });

  return (
    <group ref={grupo}>
      <mesh>
        <sphereGeometry args={[2, 40, 26]} />
        <meshBasicMaterial color="#2563eb" wireframe transparent opacity={0.22} />
      </mesh>
      {/* brilho interno do planeta */}
      <mesh>
        <sphereGeometry args={[1.94, 32, 20]} />
        <meshBasicMaterial color="#1e3a8a" transparent opacity={0.35} />
      </mesh>
      {SEDES.map((s) => (
        <Pin key={s.id} sede={s} ativo={s.id === selecionado} onSelecionar={onSelecionar} />
      ))}
    </group>
  );
}

function formatarCoord(n: number, positivo: string, negativo: string): string {
  const dir = n >= 0 ? positivo : negativo;
  return `${Math.abs(n).toFixed(3)}° ${dir}`;
}

function PainelSede({ sede }: { sede: Sede }) {
  const [imgErro, setImgErro] = useState(false);
  useEffect(() => setImgErro(false), [sede.id]);
  const total = totalQuadro(sede);
  const max = Math.max(...sede.quadro.map((q) => q.qtd));

  return (
    <div className="flex h-full flex-col">
      <div className="relative h-40 shrink-0 overflow-hidden border-b border-border/60">
        {sede.imagem && !imgErro ? (
          <img
            src={sede.imagem}
            alt={sede.nome}
            onError={() => setImgErro(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-gradient-to-br from-blue-950/80 via-card to-background">
            <span className="text-4xl">🏢</span>
            <span className="text-xs text-muted-foreground">{sede.cidade}</span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 to-transparent px-4 pb-2 pt-8">
          <div className="text-base font-black leading-tight">{sede.nome}</div>
          <div className="text-[11px] text-muted-foreground">
            {sede.cidade} · {sede.pais} · {formatarCoord(sede.lat, "N", "S")}{" "}
            {formatarCoord(sede.lon, "L", "O")}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        <p className="text-[12px] italic leading-snug text-muted-foreground">{sede.destaque}</p>

        <div className="rounded-xl border border-border/50 bg-background/40 p-3">
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Quadro de funcionários
            </span>
            <span className="text-xl font-black text-primary">{total.toLocaleString("pt-BR")}</span>
          </div>
          <div className="mt-2 space-y-1.5">
            {sede.quadro.map((q) => (
              <div key={q.cargo}>
                <div className="flex items-baseline justify-between text-[11px]">
                  <span className="text-foreground/90">{q.cargo}</span>
                  <span className="font-semibold text-muted-foreground">
                    {q.qtd.toLocaleString("pt-BR")}
                  </span>
                </div>
                <div className="mt-0.5 h-1.5 rounded-full bg-muted/30">
                  <div
                    className="h-full rounded-full bg-primary/70"
                    style={{ width: `${Math.max(4, (q.qtd / max) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground">
          Clique num ponto do globo pra voar até outra sede.
        </p>
      </div>
    </div>
  );
}

interface Props {
  /** id da sede aberta (id da divisão ou "tower"); null = fechado. */
  sedeAberta: string | null;
  onFechar: () => void;
  onSelecionar: (id: string) => void;
}

export function MapaSedes({ sedeAberta, onFechar, onSelecionar }: Props) {
  const sede = sedePorId(sedeAberta);
  return (
    <Dialog open={!!sede} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="flex h-[86vh] max-h-[86vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl">
        <DialogHeader className="shrink-0 border-b border-border/60 bg-card px-5 py-3 text-left">
          <DialogTitle>Sedes do império · mapa 3D</DialogTitle>
          <DialogDescription className="text-xs">
            {SEDES.length} sedes no globo — clique num ponto pra voar até a sede.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <div className="relative h-64 shrink-0 border-b border-border/60 bg-gradient-to-b from-blue-950/40 to-background lg:h-auto lg:min-w-0 lg:flex-1 lg:border-b-0 lg:border-r">
            <Canvas
              camera={{ position: [0, 0.6, 6.4], fov: 45 }}
              dpr={[1, 2]}
              gl={{ antialias: true, alpha: true }}
            >
              <Estrelas />
              <Globo selecionado={sedeAberta ?? "tower"} onSelecionar={onSelecionar} />
            </Canvas>
          </div>
          {sede && (
            <aside className="min-h-0 w-full shrink-0 lg:w-[340px]">
              <PainelSede sede={sede} />
            </aside>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
