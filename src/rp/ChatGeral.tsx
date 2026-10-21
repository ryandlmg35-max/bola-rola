import { useEffect, useRef, useState } from "react";
import { Send, Radio } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRP } from "./store";
import { ConviteReuniaoCard } from "./ConviteReuniaoCard";
import type { MsgGeral } from "./types";

interface Props {
  aberto: boolean;
  onFechar: () => void;
  onIrParaReuniao: () => void;
}

/** Avatar: cor e inicial por personagem do canal aberto. */
function avatar(de: string): { inicial: string; cls: string } {
  if (de === "ryan") return { inicial: "R", cls: "bg-primary/25 text-primary" };
  if (de === "axiom") return { inicial: "A", cls: "bg-primary/20 text-primary" };
  if (de === "sofia") return { inicial: "S", cls: "bg-ouro/20 text-ouro" };
  const nome = de.split(" ");
  return {
    inicial: `${nome[0]?.[0] ?? "?"}${nome[1]?.[0] ?? ""}`.toUpperCase(),
    cls: "bg-cyan-500/15 text-cyan-300",
  };
}

function rotulo(de: string): string {
  if (de === "ryan") return "Ryan Dalbert · Chairman";
  if (de === "axiom") return "Axiom · Chief of Staff";
  if (de === "sofia") return "Sofia Mendes · CFO";
  return de;
}

/**
 * Chat geral do 130º — canal aberto estilo messenger.
 * O Ryan fala com o Axiom; Sofia, CEOs e conselho ouvem e reagem.
 * Os chips sob a fala do Ryan mostram o que a conversa moveu no império.
 */
export function ChatGeral({ aberto, onFechar, onIrParaReuniao }: Props) {
  const { estado, geralPensando, falarNoGeral, dispensarConvite, iaErro } = useRP();
  const [texto, setTexto] = useState("");
  const listaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listaRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [estado.chatGeral.length, geralPensando, aberto]);

  const mandar = async () => {
    const t = texto;
    setTexto("");
    if (t.trim()) await falarNoGeral(t);
  };

  const renderMsg = (m: MsgGeral) => {
    const a = avatar(m.de);
    const meu = m.de === "ryan";
    const eco = m.auto === true;
    return (
      <div key={m.id} className={`flex gap-2.5 ${meu ? "flex-row-reverse" : "flex-row"}`}>
        <span
          className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${a.cls}`}
        >
          {a.inicial}
        </span>
        <div className={`max-w-[78%] ${meu ? "text-right" : "text-left"}`}>
          <div className="mb-0.5 flex items-baseline gap-1.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
            <span>{rotulo(m.de)}</span>
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
            {eco && (
              <span className="rounded-full border border-ouro/40 bg-ouro/10 px-1.5 py-px text-[8px] text-ouro">
                reagiu ao canal
              </span>
            )}
          </div>
          {!meu && m.pensamento && (
            <details className="mb-1 text-left">
              <summary className="cursor-pointer select-none text-[10px] text-muted-foreground hover:text-foreground">
                pensou por {Math.max(1, Math.round((m.pensouMs ?? 0) / 1000))}s
              </summary>
              <pre className="mt-1 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-lg border border-border/50 bg-background/50 p-2 text-[10px] leading-snug text-muted-foreground">
                {m.pensamento}
              </pre>
            </details>
          )}
          <div
            className={`rounded-2xl px-3.5 py-2.5 text-left text-sm leading-relaxed ${
              meu
                ? "rounded-br-sm border border-primary/30 bg-primary/15"
                : eco
                  ? "rounded-bl-sm border border-ouro/30 bg-ouro/5"
                  : "rounded-bl-sm border border-primary/30 bg-muted/40"
            }`}
          >
            {m.texto}
          </div>
          {m.chips && m.chips.length > 0 && (
            <div className={`mt-1 flex flex-wrap gap-1 ${meu ? "justify-end" : "justify-start"}`}>
              {m.chips.map((c, i) => (
                <span
                  key={`${m.id}-chip-${i}`}
                  className="rounded-full border border-border/60 bg-background/60 px-1.5 py-px text-[9px] font-semibold text-muted-foreground"
                >
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="flex h-[86vh] max-h-[86vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 border-b border-border/60 bg-card px-5 py-4 text-left">
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
              <Radio className="h-4 w-4 text-primary" />
            </span>
            Canal aberto · 130º andar
            <span className="text-xs font-normal text-muted-foreground">
              Axiom responde · todo império ouve
            </span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            {estado.config.habilitada
              ? `IA ligada · ${estado.config.modelos.axiom.split("/").pop()} · o que você fala aqui vira repercussão no império`
              : "Modo local determinístico — fala com o Axiom, o império escuta e reage."}
          </DialogDescription>
          {iaErro && (
            <div className="mt-2 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-[11px] leading-snug text-destructive">
              <strong className="font-bold">IA caiu — motor local assumiu.</strong>{" "}
              <span className="opacity-80">{iaErro}</span>
              {iaErro.includes("403") && (
                <span className="mt-1 block opacity-80">
                  A chave NVIDIA tá valendo pra listar modelo, mas sem permissão de inferência
                  (conta sem crédito). Gera chave nova em build.nvidia.com ou cola outra em Ajustes.
                </span>
              )}
            </div>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px]">
            <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 font-semibold text-primary">
              Heat {estado.heat}/100
            </span>
            <span className="rounded-full border border-border/60 bg-background/40 px-2 py-0.5 text-muted-foreground">
              Tensão {estado.mundo.tensao}/100
            </span>
            <span className="rounded-full border border-border/60 bg-background/40 px-2 py-0.5 text-muted-foreground">
              Aprovação {estado.aprovacao}/100
            </span>
            <span className="rounded-full border border-border/60 bg-background/40 px-2 py-0.5 text-muted-foreground">
              Moral {estado.moral}/100
            </span>
          </div>
        </DialogHeader>

        <div ref={listaRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {estado.chatGeral.map((m) => renderMsg(m))}
          {geralPensando && (
            <div className="flex gap-2.5">
              <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[11px] font-black text-primary">
                A
              </span>
              <div className="rounded-2xl rounded-bl-sm border border-primary/30 bg-muted/40 px-3.5 py-2.5 text-sm text-muted-foreground">
                Axiom tá lendo o canal…
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
          <Textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void mandar();
              }
            }}
            placeholder="Fala no canal aberto… (Enter envia · Shift+Enter quebra linha)"
            className="mb-2 min-h-[56px] resize-none bg-background/60"
            rows={2}
            disabled={geralPensando}
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              Sofia, CEOs e conselho ouvem tudo — e reagem.
            </span>
            <Button
              size="sm"
              onClick={() => void mandar()}
              disabled={geralPensando || !texto.trim()}
            >
              <Send className="mr-1 h-4 w-4" /> FALAR
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
