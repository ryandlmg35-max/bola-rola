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
import { ConviteReuniaoCard } from "./ConviteReuniaoCard";

interface Props {
  aberto: boolean;
  onFechar: () => void;
  onIrParaReuniao: () => void;
}

export function ChatAxiom({ aberto, onFechar, onIrParaReuniao }: Props) {
  const { estado, axiomPensando, falarComAxiom, marcarLidas, dispensarConvite, iaErro } = useRP();
  const [texto, setTexto] = useState("");
  const listaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (aberto) marcarLidas("axiom");
  }, [aberto, marcarLidas]);

  useEffect(() => {
    const el = listaRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [estado.chatAxiom.length, axiomPensando, aberto]);

  const mandar = async () => {
    const t = texto;
    setTexto("");
    if (t.trim()) await falarComAxiom(t);
  };

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="flex h-[78vh] max-h-[78vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 border-b border-border/60 bg-card px-5 py-4 text-left">
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-sm font-black text-primary">
              A
            </span>
            Axiom
            <span className="text-xs font-normal text-muted-foreground">
              Chief of Staff · braço direito
            </span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            {estado.config.habilitada
              ? `Respondendo por IA · ${estado.config.modelos.axiom.split("/").pop()}`
              : "Axiom local — lê o caixa, o conselho e o feed real, motor determinístico."}
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
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px]">
            <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 font-semibold text-primary">
              Tensão do conselho {estado.mundo.tensao}/100
            </span>
            <span className="rounded-full border border-border/60 bg-background/40 px-2 py-0.5 text-muted-foreground">
              {estado.mundo.clima}
            </span>
            {estado.mundo.conflitos.length > 0 && (
              <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-amber-300">
                {estado.mundo.conflitos.length} atrito(s)
              </span>
            )}
          </div>
        </DialogHeader>

        <div ref={listaRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {estado.chatAxiom.map((m) => (
            <div key={m.id} className={`flex ${m.de === "ryan" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  m.de === "ryan"
                    ? "rounded-br-sm border border-primary/30 bg-primary/15 text-foreground"
                    : "rounded-bl-sm border border-primary/30 bg-muted/40 text-foreground"
                }`}
              >
                <div className="mb-0.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                  {m.de === "ryan" ? "Ryan" : "Axiom"}
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
                    <span className="rounded-full bg-primary/20 px-1.5 py-px text-[8px] text-primary">
                      sozinho
                    </span>
                  )}
                </div>
                {m.texto}
              </div>
            </div>
          ))}
          {axiomPensando && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-sm border border-primary/30 bg-muted/40 px-3.5 py-2.5 text-sm text-muted-foreground">
                Axiom tá checando os números…
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
              placeholder="Fala com o Axiom… (Enter envia)"
              disabled={axiomPensando}
            />
            <Button
              size="sm"
              onClick={() => void mandar()}
              disabled={axiomPensando || !texto.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
