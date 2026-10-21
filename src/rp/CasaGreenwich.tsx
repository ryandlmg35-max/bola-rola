import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Check, Heart, Home, MapPin, Phone, Send, Sparkles } from "lucide-react";
import { Canvas } from "@react-three/fiber";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useRP } from "./store";
import { CASA_MR } from "./viagens";
import { humorSofia } from "./sofia";

/**
 * Casa MR em Greenwich — leitura low-poly da foto: mansão de pedra à beira
 * d'água, heliponto H, piscina, doca e iate. Cena estática (frameloop demand)
 * pra não competir com o globo do painel.
 */

function Arvore({ x, z, escala = 1 }: { x: number; z: number; escala?: number }) {
  return (
    <group position={[x, 0, z]} scale={escala}>
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.05, 0.07, 0.5, 6]} />
        <meshStandardMaterial color="#4b3621" />
      </mesh>
      <mesh position={[0, 0.75, 0]}>
        <coneGeometry args={[0.35, 0.9, 7]} />
        <meshStandardMaterial color="#1f4d2b" />
      </mesh>
    </group>
  );
}

function CasaCena() {
  return (
    <group>
      {/* gramado e água */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -0.6]}>
        <planeGeometry args={[11, 6.4]} />
        <meshStandardMaterial color="#2d5a3d" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 3.3]}>
        <planeGeometry args={[12, 4.2]} />
        <meshStandardMaterial color="#123b5c" roughness={0.35} metalness={0.15} />
      </mesh>

      {/* corpo principal */}
      <group position={[0, 0.55, -0.6]}>
        <mesh>
          <boxGeometry args={[3.2, 1.25, 1.5]} />
          <meshStandardMaterial color="#d8cdbd" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.72, 0]}>
          <boxGeometry args={[3.35, 0.18, 1.65]} />
          <meshStandardMaterial color="#8a7b6a" roughness={0.8} />
        </mesh>
        {/* telhado principal — quatro águas, low-poly */}
        <mesh position={[0, 1.08, 0]} rotation={[0, Math.PI / 4, 0]} scale={[1, 1, 0.62]}>
          <coneGeometry args={[2.05, 0.55, 4]} />
          <meshStandardMaterial color="#6b5a4a" roughness={0.86} />
        </mesh>
        <mesh position={[0.82, 1.42, 0.18]}>
          <boxGeometry args={[0.16, 0.45, 0.16]} />
          <meshStandardMaterial color="#8a7b6a" roughness={0.9} />
        </mesh>
        <mesh position={[0.82, 1.66, 0.18]}>
          <boxGeometry args={[0.22, 0.06, 0.22]} />
          <meshStandardMaterial color="#4b3d31" roughness={0.8} />
        </mesh>
        {/* alas */}
        <mesh position={[-2.05, -0.12, 0]}>
          <boxGeometry args={[1.15, 1.0, 1.25]} />
          <meshStandardMaterial color="#e2d8c8" roughness={0.9} />
        </mesh>
        <mesh position={[2.05, -0.12, 0]}>
          <boxGeometry args={[1.15, 1.0, 1.25]} />
          <meshStandardMaterial color="#e2d8c8" roughness={0.9} />
        </mesh>
        {/* colunas da fachada */}
        {[-1.25, -0.75, -0.25, 0.25, 0.75, 1.25].map((x) => (
          <mesh key={x} position={[x, -0.05, 0.78]}>
            <cylinderGeometry args={[0.055, 0.07, 1.0, 8]} />
            <meshStandardMaterial color="#f1e9dc" roughness={0.7} />
          </mesh>
        ))}
        {/* janelas */}
        {[-0.9, -0.3, 0.3, 0.9].map((x) => (
          <mesh key={x} position={[x, 0.05, 0.77]}>
            <boxGeometry args={[0.32, 0.45, 0.03]} />
            <meshStandardMaterial
              color="#17324d"
              emissive="#f4c76b"
              emissiveIntensity={0.35}
              roughness={0.2}
            />
          </mesh>
        ))}
        {/* porta central */}
        <mesh position={[0, -0.35, 0.79]}>
          <boxGeometry args={[0.34, 0.55, 0.04]} />
          <meshStandardMaterial color="#3b2a1d" roughness={0.6} />
        </mesh>
      </group>

      {/* piscina e deck */}
      <group position={[2.75, 0.0, 1.1]}>
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.0, 0.95]} />
          <meshStandardMaterial color="#7dd3fc" roughness={0.15} metalness={0.2} />
        </mesh>
        <mesh position={[0, -0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.25, 1.2]} />
          <meshStandardMaterial color="#d8cdbd" roughness={0.9} />
        </mesh>
      </group>

      {/* heliponto H */}
      <group position={[-2.6, 0.0, 1.6]}>
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.82, 32]} />
          <meshStandardMaterial color="#1f2937" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.58, 0.68, 32]} />
          <meshBasicMaterial color="#f8fafc" />
        </mesh>
        <mesh position={[-0.16, 0.06, 0]}>
          <boxGeometry args={[0.07, 0.01, 0.42]} />
          <meshBasicMaterial color="#f8fafc" />
        </mesh>
        <mesh position={[0.16, 0.06, 0]}>
          <boxGeometry args={[0.07, 0.01, 0.42]} />
          <meshBasicMaterial color="#f8fafc" />
        </mesh>
        <mesh position={[0, 0.06, 0]}>
          <boxGeometry args={[0.34, 0.01, 0.07]} />
          <meshBasicMaterial color="#f8fafc" />
        </mesh>
      </group>

      {/* doca e iate */}
      <group position={[0.4, 0, 3.1]}>
        <mesh position={[0, 0.01, 0]}>
          <boxGeometry args={[0.45, 0.08, 1.9]} />
          <meshStandardMaterial color="#6b543d" roughness={0.9} />
        </mesh>
        {[-0.65, 0.65].map((z) => (
          <mesh key={z} position={[0, -0.12, z]}>
            <cylinderGeometry args={[0.035, 0.035, 0.25, 6]} />
            <meshStandardMaterial color="#3f2d1e" />
          </mesh>
        ))}
      </group>
      <group position={[1.4, 0.02, 3.5]}>
        <mesh position={[0, 0.02, 0]}>
          <boxGeometry args={[1.15, 0.18, 0.42]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.35} metalness={0.15} />
        </mesh>
        <mesh position={[0.05, 0.16, 0]}>
          <boxGeometry args={[0.5, 0.2, 0.32]} />
          <meshStandardMaterial color="#0f2a44" roughness={0.4} />
        </mesh>
        <mesh position={[-0.35, 0.18, 0]}>
          <boxGeometry args={[0.18, 0.12, 0.26]} />
          <meshStandardMaterial color="#d8cdbd" roughness={0.5} />
        </mesh>
        <mesh position={[0.68, 0.02, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.21, 0.34, 4]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.35} metalness={0.15} />
        </mesh>
        <mesh position={[0.02, 0.42, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.42, 6]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
      </group>

      {/* árvores e cerca viva */}
      <Arvore x={-4.1} z={-1.5} escala={1.15} />
      <Arvore x={-3.5} z={-2.3} escala={0.9} />
      <Arvore x={4.0} z={-1.7} escala={1.05} />
      <Arvore x={4.4} z={-0.6} escala={0.8} />
      <mesh position={[0, 0.12, -2.4]}>
        <boxGeometry args={[7.4, 0.25, 0.25]} />
        <meshStandardMaterial color="#1f4d2b" roughness={1} />
      </mesh>
    </group>
  );
}

interface Props {
  aberto: boolean;
  onFechar: () => void;
  onVoltarBase: () => void;
}

export function CasaGreenwich({ aberto, onFechar, onVoltarBase }: Props) {
  const estado = useRP((s) => s.estado);
  const convidarSofiaCasa = useRP((s) => s.convidarSofiaCasa);
  const falarComSofia = useRP((s) => s.falarComSofia);
  const sofiaPensando = useRP((s) => s.sofiaPensando);
  const iaErro = useRP((s) => s.iaErro);
  const decisao = estado.sofiaNaCasa;

  const [texto, setTexto] = useState("");
  const chatFimRef = useRef<HTMLDivElement>(null);
  const msgsRecentes = estado.chatSofia.slice(-8);
  const humor = humorSofia(estado.sofia);

  useEffect(() => {
    if (aberto) {
      chatFimRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [aberto, msgsRecentes.length]);

  const mandarSofia = () => {
    const t = texto.trim();
    if (!t || sofiaPensando) return;
    void falarComSofia(t);
    setTexto("");
  };

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="shrink-0 border-b border-border/60 bg-card px-5 py-3 text-left">
          <DialogTitle className="flex items-center gap-2">
            <Home className="h-4 w-4 text-ouro" />
            Casa MR · Greenwich
          </DialogTitle>
          <DialogDescription className="text-xs">
            {CASA_MR.lat.toFixed(3)}° N · {Math.abs(CASA_MR.lon).toFixed(3)}° O · Connecticut, EUA ·
            20 acres à beira-mar
          </DialogDescription>
        </DialogHeader>

        <div className="relative h-72 shrink-0 overflow-hidden border-b border-border/60 bg-gradient-to-b from-blue-950/45 to-background sm:h-80">
          <Canvas
            dpr={1}
            camera={{ position: [5.6, 3.4, 6.2], fov: 38 }}
            gl={{ antialias: false, alpha: true, powerPreference: "low-power" }}
            frameloop="demand"
          >
            <ambientLight intensity={0.7} />
            <hemisphereLight args={["#bfdbfe", "#1f2937", 0.8]} />
            <directionalLight position={[5, 6, 4]} intensity={1.6} />
            <CasaCena />
          </Canvas>
          <div className="pointer-events-none absolute left-3 top-3 rounded-lg border border-border/60 bg-background/80 px-2.5 py-1.5 backdrop-blur">
            <div className="text-[9px] font-black uppercase tracking-[0.18em] text-ouro">
              Propriedade privada
            </div>
            <div className="text-[12px] font-semibold">Casa MR · Greenwich</div>
            <div className="text-[10px] text-muted-foreground">
              heliponto H · piscina · doca · iate
            </div>
          </div>
          <div className="pointer-events-none absolute bottom-3 right-3 rounded-lg border border-border/60 bg-background/80 px-2.5 py-1.5 text-right backdrop-blur">
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Marina</div>
            <div className="text-[11px] font-semibold">Long Island Sound</div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_1.1fr]">
            <div className="space-y-2 rounded-xl border border-border/50 bg-background/40 p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                A propriedade
              </div>
              <ul className="space-y-1.5 text-[12px] text-foreground/85">
                <li className="flex gap-2">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  Mansão de pedra com duas alas, piscina e jardim fechado.
                </li>
                <li className="flex gap-2">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  Heliponto H próprio — o H145 da casa pousa na porta.
                </li>
                <li className="flex gap-2">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  Doca privada e iate para sair do Long Island Sound sem passar por aeroporto.
                </li>
                <li className="flex gap-2">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  Perímetro da Muralha de Greenwich ativo: jammers, câmeras e GIGN.
                </li>
              </ul>
            </div>

            <div className="flex flex-col rounded-xl border border-ouro/35 bg-gradient-to-br from-ouro/10 via-card to-background p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-ouro">
                    Sofia · {humor.label}
                  </div>
                  <div className="mt-0.5 text-sm font-bold">
                    {decisao === true
                      ? "Ela está na casa."
                      : decisao === false
                        ? "Ela ficou em Nova York."
                        : "Ainda não foi chamada."}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant="outline"
                    className={
                      decisao === true
                        ? "border-rose-400/40 text-rose-300"
                        : "border-border/60 text-muted-foreground"
                    }
                  >
                    {decisao === true ? (
                      <>
                        <Heart className="mr-1 h-3 w-3" /> na casa
                      </>
                    ) : (
                      <>
                        <MapPin className="mr-1 h-3 w-3" /> NYC
                      </>
                    )}
                  </Badge>
                  {decisao === null && (
                    <Button
                      size="sm"
                      onClick={() => convidarSofiaCasa()}
                      className="h-7 bg-ouro px-2.5 text-[11px] font-bold text-black hover:bg-ouro/90"
                    >
                      <Phone className="mr-1 h-3 w-3" /> Chamar
                    </Button>
                  )}
                  {decisao === false && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => convidarSofiaCasa(true)}
                      className="h-7 border-ouro/40 px-2.5 text-[11px] text-ouro"
                    >
                      <Sparkles className="mr-1 h-3 w-3" /> Chamar de novo
                    </Button>
                  )}
                </div>
              </div>

              {/* Chat integrado de Greenwich */}
              {iaErro && (
                <div className="mt-2 rounded-md border border-red-500/40 bg-red-500/10 px-2 py-1 text-[10px] leading-snug text-red-300">
                  IA fora — respondendo no motor local. {iaErro.slice(0, 120)}
                </div>
              )}
              <div className="mt-2.5 flex max-h-48 min-h-36 flex-1 flex-col gap-1.5 overflow-y-auto rounded-lg border border-border/50 bg-background/50 p-2 text-[12px]">
                {msgsRecentes.map((m) => {
                  const deRyan = m.de === "ryan";
                  return (
                    <div key={m.id} className={`flex ${deRyan ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[85%] rounded-lg px-2.5 py-1.5 leading-snug ${
                          deRyan
                            ? "bg-primary/20 text-foreground"
                            : "bg-card text-foreground/90 border border-border/40"
                        }`}
                      >
                        {!deRyan && m.fonte && (
                          <span
                            className={`mb-0.5 block text-[9px] uppercase tracking-wider ${
                              m.fonte === "ia" ? "text-ouro/80" : "text-muted-foreground/70"
                            }`}
                          >
                            {m.fonte === "ia" ? "IA" : "motor local"}
                          </span>
                        )}
                        <p className="whitespace-pre-line">{m.texto}</p>
                      </div>
                    </div>
                  );
                })}
                {sofiaPensando && (
                  <div className="flex justify-start">
                    <div className="rounded-lg bg-card px-2.5 py-1 text-[11px] text-muted-foreground italic">
                      Sofia digitando…
                    </div>
                  </div>
                )}
                <div ref={chatFimRef} />
              </div>

              {/* Campo de envio */}
              <div className="mt-2 flex gap-1.5">
                <Textarea
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      mandarSofia();
                    }
                  }}
                  placeholder={
                    decisao === true
                      ? "Fala com a Sofia na varanda… (a sós, em Greenwich)"
                      : "Manda mensagem pra Sofia em Nova York…"
                  }
                  rows={1}
                  className="min-h-[36px] resize-none bg-background/70 text-[12px] py-1.5"
                  disabled={sofiaPensando}
                />
                <Button
                  size="sm"
                  className="h-9 px-3"
                  onClick={mandarSofia}
                  disabled={sofiaPensando || !texto.trim()}
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border/60 bg-card px-4 py-2.5">
          <span className="text-[10px] text-muted-foreground">
            Você escolheu dormir em Greenwich. A torre continua de pé.
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onVoltarBase}>
              <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Voltar pra base
            </Button>
            <Button size="sm" onClick={onFechar}>
              Ficar em casa
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
