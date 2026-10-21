import { useEffect, useRef, useState } from "react";
import { X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useRP } from "./store";
import { perfilPorId, labelRelacao } from "./ceos";
import type { MsgCEO } from "./types";

interface Props {
  divisaoId: string | null;
  onFechar: () => void;
}

function BolinhaCEO({ msg, ceoNome }: { msg: MsgCEO; ceoNome: string }) {
  const deMim = msg.de === "ryan";
  return (
    <div className={`flex ${deMim ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed ${
          deMim
            ? "rounded-br-sm bg-primary/20 text-foreground"
            : "rounded-bl-sm bg-card/80 text-foreground/90"
        }`}
      >
        {!deMim && (
          <div className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-primary/70">
            {ceoNome}
          </div>
        )}
        <p className="whitespace-pre-line">{msg.texto}</p>
        <div className="mt-1 text-[9px] text-muted-foreground">Turno {msg.turno}</div>
      </div>
    </div>
  );
}

export function ChatCEO({ divisaoId, onFechar }: Props) {
  const { estado, falarComCEO } = useRP();
  const [texto, setTexto] = useState("");
  const fimRef = useRef<HTMLDivElement>(null);

  const perfil = divisaoId ? perfilPorId(divisaoId) : undefined;
  const mensagens: MsgCEO[] = divisaoId ? (estado.chatsCEOs[divisaoId] ?? []) : [];
  const relValor = perfil ? (estado.relacoes[perfil.relacaoChave] ?? 50) : 50;
  const { label: relLabel, cor: relCor } = labelRelacao(relValor);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens.length]);

  if (!divisaoId || !perfil) return null;

  const enviar = () => {
    const t = texto.trim();
    if (!t) return;
    falarComCEO(divisaoId, t);
    setTexto("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:items-center sm:justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onFechar} />
      <div className="relative z-10 flex h-[75vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border/60 bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 bg-card/80 px-4 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-bold">{perfil.nome}</span>
              <Badge
                variant="outline"
                className={`text-[10px] font-semibold ${relCor} border-current/30`}
              >
                {relLabel} · {relValor}
              </Badge>
            </div>
            <div className="text-[11px] text-muted-foreground">
              {perfil.cargo} · {perfil.divisao}
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={onFechar}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Barra de relação */}
        <div className="px-4 pt-2">
          <div className="h-1 rounded-full bg-muted/40">
            <div
              className={`h-1 rounded-full transition-all ${
                relValor >= 70 ? "bg-primary" : relValor >= 40 ? "bg-ouro" : "bg-destructive"
              }`}
              style={{ width: `${Math.max(0, relValor)}%` }}
            />
          </div>
        </div>

        {/* Mensagens */}
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {mensagens.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-[13px] text-muted-foreground">
              <div className="text-2xl">💼</div>
              <p>
                Nenhuma conversa com {perfil.nome} ainda.
                <br />
                Nível de relação: <span className={relCor}>{relLabel}</span>
              </p>
            </div>
          )}
          {mensagens.map((m) => (
            <BolinhaCEO key={m.id} msg={m} ceoNome={perfil.nome} />
          ))}
          <div ref={fimRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border/50 bg-card/60 p-3">
          <Textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                enviar();
              }
            }}
            placeholder={`Fala com ${perfil.nome}…`}
            className="mb-2 min-h-[52px] resize-none bg-background/60 text-[14px]"
            rows={2}
          />
          <div className="flex justify-end">
            <Button size="sm" onClick={enviar} disabled={!texto.trim()}>
              <Send className="mr-1 h-3.5 w-3.5" /> Enviar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
