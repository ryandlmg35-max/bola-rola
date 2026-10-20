import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useRP } from "./store";
import { loreLinhas } from "./lore";

interface Props {
  aberto: boolean;
  onFechar: () => void;
}

export function Ajustes({ aberto, onFechar }: Props) {
  const { estado, ajustarConfig, resetar, exportar, importar } = useRP();
  const cfg = estado.config;
  const arquivoRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState("");

  const importarArquivo = async (f: File | undefined) => {
    if (!f) return;
    const ok = importar(await f.text());
    setMsg(ok ? `Save importado — turno ${useRP.getState().estado.turno}.` : "Arquivo inválido.");
  };

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajustes do império</DialogTitle>
          <DialogDescription>
            Motor híbrido: engine local calcula os números, IA opcional só narra a cena.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 p-3">
            <div>
              <Label htmlFor="ia-on">Narrativa por IA</Label>
              <p className="text-xs text-muted-foreground">
                Requer chave de API compatível com OpenAI. Desligado = engine local, 100% grátis.
              </p>
            </div>
            <Switch
              id="ia-on"
              checked={cfg.habilitada}
              onCheckedChange={(v) => ajustarConfig({ habilitada: v })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="base">Base URL</Label>
            <Input
              id="base"
              value={cfg.baseUrl}
              onChange={(e) => ajustarConfig({ baseUrl: e.target.value })}
              placeholder="https://api.openai.com/v1"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="key">Chave de API</Label>
            <Input
              id="key"
              type="password"
              value={cfg.apiKey}
              onChange={(e) => ajustarConfig({ apiKey: e.target.value })}
              placeholder="sk-…"
            />
            <p className="text-[11px] text-muted-foreground">
              Guardada só no teu navegador (localStorage), nunca sai daqui.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="modelo">Modelo</Label>
            <Input
              id="modelo"
              value={cfg.modelo}
              onChange={(e) => ajustarConfig({ modelo: e.target.value })}
              placeholder="gpt-4o-mini"
            />
          </div>

          <div className="rounded-lg border border-border/60 bg-background/40 p-3 text-xs text-muted-foreground">
            Memória oculta: roleplat.txt com {loreLinhas.toLocaleString("pt-BR")} linhas embutido no
            bundle. Cada turno a IA busca os trechos relevantes lá dentro pra manter continuidade.
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={exportar}>
              Exportar save
            </Button>
            <Button size="sm" variant="outline" onClick={() => arquivoRef.current?.click()}>
              Importar save
            </Button>
            <input
              ref={arquivoRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => void importarArquivo(e.target.files?.[0])}
            />
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                if (
                  window.confirm("Resetar o RP pro estado inicial (turno 0)? O save atual sai.")
                ) {
                  resetar();
                  setMsg("Resetado — turno 0.");
                }
              }}
            >
              Resetar RP
            </Button>
          </div>

          {msg && <p className="text-xs text-primary">{msg}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
