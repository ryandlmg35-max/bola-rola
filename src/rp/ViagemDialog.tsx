import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  CalendarPlus,
  Car,
  Check,
  Clock,
  MapPin,
  Navigation,
  Plane,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useRP } from "./store";
import { formatarDuracao, localPorId, nomeLocal, opcoesViagem, type OpcaoViagem } from "./viagens";
import { MapaViagem3D } from "./MapaViagem3D";

interface Props {
  destino: string | null;
  onFechar: () => void;
  onConcluir: (destinoId: string, veiculoId: string) => void;
}

function IconeVeiculo({ tipo }: { tipo: OpcaoViagem["tipo"] }) {
  if (tipo === "jato") return <Plane className="h-5 w-5" />;
  if (tipo === "helicoptero") return <Navigation className="h-5 w-5" />;
  return <Car className="h-5 w-5" />;
}

export function ViagemDialog({ destino, onFechar, onConcluir }: Props) {
  const estado = useRP((s) => s.estado);
  const origem = localPorId(estado.localizacao);
  const destinoLocal = destino ? localPorId(destino) : null;
  const opcoes = destinoLocal ? opcoesViagem(origem, destinoLocal) : [];
  const [viajando, setViajando] = useState(false);
  const [escolhido, setEscolhido] = useState<string | null>(null);
  const concluirRef = useRef(onConcluir);

  useEffect(() => {
    concluirRef.current = onConcluir;
  }, [onConcluir]);

  useEffect(() => {
    setViajando(false);
    setEscolhido(null);
  }, [destino]);

  useEffect(() => {
    if (!viajando || !escolhido || !destino) return;
    const timer = window.setTimeout(() => concluirRef.current(destino, escolhido), 2600);
    return () => window.clearTimeout(timer);
  }, [viajando, escolhido, destino]);

  const escolha = opcoes.find((o) => o.id === escolhido);
  const ehReuniao =
    !!destinoLocal &&
    (estado.convite?.localId === destinoLocal.id ||
      estado.reuniaoAtual?.localId === destinoLocal.id);
  const titulo = ehReuniao
    ? "Ir para a reunião"
    : destinoLocal?.tipo === "casa"
      ? "Ir para casa"
      : destinoLocal?.tipo === "base"
        ? "Voltar pra base"
        : "Deslocamento executivo";

  return (
    <Dialog open={!!destinoLocal} onOpenChange={(o) => !o && !viajando && onFechar()}>
      <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="shrink-0 border-b border-border/60 bg-card px-5 py-3 text-left">
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-ouro" />
            {titulo}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Escolha uma aeronave ou carro disponível em {nomeLocal(origem)}. O mapa 3D só aparece
            neste evento.
          </DialogDescription>
        </DialogHeader>

        {destinoLocal && (
          <div className="grid min-h-0 flex-1 md:grid-cols-[1.15fr_.85fr]">
            <div className="relative h-64 shrink-0 overflow-hidden border-b border-border/60 bg-gradient-to-b from-blue-950/50 to-background md:h-auto md:border-b-0 md:border-r">
              <MapaViagem3D origem={origem} destino={destinoLocal} viajando={viajando} />
              <div className="pointer-events-none absolute left-3 top-3 rounded-lg border border-border/60 bg-background/80 px-2.5 py-1.5 backdrop-blur">
                <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                  Origem
                </div>
                <div className="text-[11px] font-semibold">{nomeLocal(origem)}</div>
              </div>
              <div className="pointer-events-none absolute bottom-3 right-3 rounded-lg border border-ouro/40 bg-background/85 px-2.5 py-1.5 text-right backdrop-blur">
                <div className="text-[9px] font-bold uppercase tracking-wider text-ouro">
                  Destino
                </div>
                <div className="text-[11px] font-semibold">{nomeLocal(destinoLocal)}</div>
              </div>
              {viajando && (
                <div className="absolute inset-x-3 bottom-16 rounded-xl border border-ouro/40 bg-background/90 p-2.5 backdrop-blur">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-ouro">A caminho…</span>
                    <span className="text-muted-foreground">{escolha?.nome}</span>
                  </div>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted/40">
                    <div className="h-full w-full origin-left animate-[pulse_1.2s_ease-in-out_infinite] rounded-full bg-ouro" />
                  </div>
                </div>
              )}
            </div>

            <div className="min-h-0 space-y-3 overflow-y-auto p-4">
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/50 bg-background/40 p-2.5 text-[11px]">
                <span className="font-semibold">{origem.cidade}</span>
                <ArrowRight className="h-3.5 w-3.5 text-ouro" />
                <span className="font-semibold">{destinoLocal.cidade}</span>
                <Badge variant="outline" className="ml-auto border-ouro/40 text-ouro">
                  {opcoes[0]?.km ?? 0} km
                </Badge>
              </div>

              <div className="space-y-2">
                {opcoes.map((o) => {
                  const selecionado = escolhido === o.id;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      disabled={!o.dentro || viajando}
                      onClick={() => {
                        setEscolhido(o.id);
                        setViajando(true);
                      }}
                      className={`w-full rounded-xl border p-3 text-left transition-colors ${
                        selecionado
                          ? "border-ouro/60 bg-ouro/10"
                          : o.dentro
                            ? "border-border/60 bg-background/40 hover:border-ouro/50 hover:bg-background/70"
                            : "cursor-not-allowed border-border/30 bg-background/20 opacity-45"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                            selecionado
                              ? "border-ouro/50 bg-ouro/20 text-ouro"
                              : "border-border/60 bg-card text-muted-foreground"
                          }`}
                        >
                          <IconeVeiculo tipo={o.tipo} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[13px] font-bold">{o.nome}</span>
                            {o.recomendado && o.dentro && (
                              <span className="rounded-full border border-primary/40 bg-primary/10 px-1.5 py-px text-[8px] font-bold uppercase text-primary">
                                recomendado
                              </span>
                            )}
                            {!o.dentro && (
                              <span className="text-[9px] font-bold uppercase text-destructive">
                                fora do alcance
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatarDuracao(o.minutos)}
                            </span>
                            <span>alcance {o.alcanceKm.toLocaleString("pt-BR")} km</span>
                          </div>
                          <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                            {o.nota}
                          </p>
                        </div>
                        {selecionado && <Check className="mt-1 h-4 w-4 shrink-0 text-ouro" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              <p className="text-[10px] leading-snug text-muted-foreground">
                A frota mostrada é a do local de origem. O trajeto leva alguns segundos na tela; a
                reunião abre assim que você chega.
              </p>
            </div>
          </div>
        )}

        <div className="flex shrink-0 items-center justify-between gap-2 border-t border-border/60 bg-card px-4 py-2.5">
          <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <CalendarPlus className="h-3.5 w-3.5 text-ouro" />
            {ehReuniao
              ? (estado.convite?.quando ?? estado.reuniaoAtual?.quando ?? "Reunião")
              : destinoLocal?.tipo === "casa"
                ? "Casa MR · Greenwich"
                : destinoLocal?.tipo === "base"
                  ? "Space Group Tower"
                  : "Deslocamento executivo"}
          </span>
          <button
            type="button"
            onClick={onFechar}
            disabled={viajando}
            className="cursor-pointer text-[11px] font-semibold text-muted-foreground hover:text-foreground disabled:opacity-40"
          >
            Cancelar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
