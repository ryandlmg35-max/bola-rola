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

interface Props {
  aberto: boolean;
  onFechar: () => void;
}

export function ChatSofia({ aberto, onFechar }: Props) {
  const { estado, sofiaPensando, falarComSofia } = useRP();
  const [texto, setTexto] = useState("");
  const listaRef = useRef<HTMLDivElement>(null);

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
            {estado.config.habilitada && estado.config.apiKey
              ? "Respondendo por IA, com o estado real do império."
              : "Sofia local — números reais do caixa, sem chave de API."}
          </DialogDescription>
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
                <div className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                  {m.de === "ryan" ? "Ryan" : "Sofia"}
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
