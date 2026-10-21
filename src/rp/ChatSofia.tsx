import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRP } from "./store";
import { humorSofia, type TomSofia } from "./sofia";
import { ConviteReuniaoCard } from "./ConviteReuniaoCard";

const HUMOR_CLS: Record<TomSofia, string> = {
  limite: "border-destructive/50 bg-destructive/15 text-destructive",
  congelada: "border-slate-400/30 bg-slate-500/15 text-slate-300",
  derretendo: "border-rose-400/40 bg-rose-500/15 text-rose-300",
  calorosa: "border-rose-400/30 bg-rose-500/10 text-rose-200",
  tensa: "border-amber-400/40 bg-amber-500/15 text-amber-300",
  auditora: "border-primary/40 bg-primary/15 text-primary",
};

function Medidor({ label, valor, cor }: { label: string; valor: number; cor: string }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-baseline justify-between gap-1">
        <span className="truncate text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className="text-[10px] font-semibold text-muted-foreground">{valor}</span>
      </div>
      <div className="mt-0.5 h-1.5 rounded-full bg-muted/30">
        <div
          className={`h-full rounded-full transition-all duration-500 ${cor}`}
          style={{ width: `${valor}%` }}
        />
      </div>
    </div>
  );
}

interface Props {
  aberto: boolean;
  onFechar: () => void;
  onIrParaReuniao: () => void;
}

export function ChatSofia({ aberto, onFechar, onIrParaReuniao }: Props) {
  const { estado, sofiaPensando, falarComSofia, marcarLidas, dispensarConvite, iaErro } = useRP();
  const [texto, setTexto] = useState("");
  const listaRef = useRef<HTMLDivElement>(null);
  const humor = humorSofia(estado.sofia);
  const corEstresse =
    estado.sofia.estresse >= 70
      ? "bg-destructive"
      : estado.sofia.estresse >= 45
        ? "bg-amber-400"
        : "bg-primary";
  const corEnergia =
    estado.sofia.energia >= 55
      ? "bg-rose-400"
      : estado.sofia.energia >= 25
        ? "bg-primary"
        : "bg-slate-400";

  useEffect(() => {
    if (aberto) marcarLidas("sofia");
  }, [aberto, marcarLidas]);

  useEffect(() => {
    const el = listaRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [estado.chatSofia.length, sofiaPensando, aberto]);

  const mandar = async () => {
    const t = texto;
    setTexto("");
    if (t.trim()) await falarComSofia(t);
  };

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="flex h-[78vh] max-h-[78vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 border-b border-border/60 bg-card px-5 py-4 text-left">
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ouro/20 text-sm font-black text-ouro">
              S
            </span>
            Sofia Mendes
            <span className="text-xs font-normal text-muted-foreground">
              Co-CEO · CFO · conversa privada
            </span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            {estado.config.habilitada
              ? `Respondendo por IA · ${estado.config.modelos.sofia.split("/").pop()}`
              : "Sofia local — números reais do caixa, motor determinístico."}
          </DialogDescription>
          {iaErro && (
            <div className="mt-2 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-[11px] leading-snug text-destructive">
              <strong className="font-bold">IA caiu — motor local assumiu.</strong>{" "}
              <span className="opacity-80">{iaErro}</span>
              {iaErro.includes("403") && (
                <span className="mt-1 block opacity-80">
                  Chave NVIDIA sem permissão de inferência (conta sem crédito). Chave nova em
                  build.nvidia.com ou cola outra em Ajustes.
                </span>
              )}
            </div>
          )}
          <div className="mt-2 flex items-center gap-3">
            <Medidor label="Estresse" valor={estado.sofia.estresse} cor={corEstresse} />
            <Medidor label="Energia sexual" valor={estado.sofia.energia} cor={corEnergia} />
            <span
              className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${HUMOR_CLS[humor.tom]}`}
            >
              {humor.label}
            </span>
          </div>
        </DialogHeader>

        <div ref={listaRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {estado.chatSofia.map((m) => (
            <div key={m.id} className={`flex ${m.de === "ryan" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  m.de === "ryan"
                    ? "rounded-br-sm border border-primary/30 bg-primary/15 text-foreground"
                    : "rounded-bl-sm border border-ouro/30 bg-muted/40 text-foreground"
                }`}
              >
                <div className="mb-0.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                  {m.de === "ryan" ? "Ryan" : "Sofia"}
                  {m.fonte === "local" && (
                    <span
                      className="rounded-full border border-amber-400/40 bg-amber-500/10 px-1.5 py-px text-[8px] text-amber-300"
                      title="A IA não respondeu — o motor local determinístico assumiu"
                    >
                      motor local
                    </span>
                  )}
                  {m.fonte === "ia" && (
                    <span className="rounded-full border border-primary/40 bg-primary/10 px-1.5 py-px text-[8px] text-primary">
                      IA
                    </span>
                  )}
                  {m.auto && (
                    <span className="rounded-full bg-ouro/20 px-1.5 py-px text-[8px] text-ouro">
                      sozinha
                    </span>
                  )}
                </div>
                {m.texto}
              </div>
            </div>
          ))}
          {sofiaPensando && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-sm border border-ouro/30 bg-muted/40 px-3.5 py-2.5 text-sm text-muted-foreground">
                Sofia tá lendo o extrato…
              </div>
            </div>
          )}
        </div>

        {estado.convite && (
          <div className="shrink-0 border-t border-border/60 bg-card px-3 py-2">
            <ConviteReuniaoCard
              compact
              convite={estado.convite}
              noLocal={estado.convite.localId === estado.localizacao}
              onIr={() => {
                onFechar();
                onIrParaReuniao();
              }}
              onDispensar={dispensarConvite}
            />
          </div>
        )}

        <div className="shrink-0 border-t border-border/60 bg-card px-5 py-3">
          <div className="flex gap-2">
            <Input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void mandar();
                }
              }}
              placeholder="Manda pra Sofia… (Enter envia)"
              disabled={sofiaPensando}
            />
            <Button
              size="sm"
              onClick={() => void mandar()}
              disabled={sofiaPensando || !texto.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
