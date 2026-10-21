import { useEffect, useRef, useState } from "react";
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
import { BASE_NVIDIA, MODELOS_NVIDIA, NOMES_MODELOS, aplicarPreset, testarIA } from "./ia";
import type { ModelosIA, ProvedorIA } from "./types";

interface Props {
  aberto: boolean;
  onFechar: () => void;
}

type Teste = { estado: "idle" | "rodando" | "ok" | "erro"; detalhe: string };

export function Ajustes({ aberto, onFechar }: Props) {
  const { estado, ajustarConfig, ajustarModelo, resetar, exportar, importar } = useRP();
  const cfg = estado.config;
  const arquivoRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState("");
  const [teste, setTeste] = useState<Teste>({ estado: "idle", detalhe: "" });
  const [chaveServidor, setChaveServidor] = useState<boolean | null>(null);

  useEffect(() => {
    if (!aberto) return;
    let vivo = true;
    void fetch("/api/ia")
      .then((r) => (r.ok ? r.json() : { servidor: false }))
      .then((d: { servidor?: boolean }) => {
        if (vivo) setChaveServidor(Boolean(d.servidor));
      })
      .catch(() => {
        if (vivo) setChaveServidor(false);
      });
    return () => {
      vivo = false;
    };
  }, [aberto]);

  const importarArquivo = async (f: File | undefined) => {
    if (!f) return;
    const ok = importar(await f.text());
    setMsg(ok ? `Save importado — turno ${useRP.getState().estado.turno}.` : "Arquivo inválido.");
  };

  const rodarTeste = async () => {
    setTeste({ estado: "rodando", detalhe: "Chamando o modelo…" });
    const r = await testarIA({ ...cfg, habilitada: true });
    setTeste({
      estado: r.ok ? "ok" : "erro",
      detalhe: r.ok ? `Conexão ok — ${r.detalhe}` : r.detalhe,
    });
  };

  const trocarProvedor = (p: ProvedorIA) => {
    ajustarConfig(aplicarPreset(p));
    setTeste({ estado: "idle", detalhe: "" });
  };

  const campoModelo = (chave: keyof ModelosIA) => {
    const valor = cfg.modelos[chave];
    const noCatalogo = MODELOS_NVIDIA.some((m) => m.id === valor);
    return (
      <div key={chave} className="space-y-1">
        <Label htmlFor={`modelo-${chave}`} className="text-xs">
          {NOMES_MODELOS[chave]}
        </Label>
        {cfg.provedor === "nvidia" ? (
          <select
            id={`modelo-${chave}`}
            value={valor}
            onChange={(e) => ajustarModelo(chave, e.target.value)}
            className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs text-foreground outline-none focus:border-primary"
          >
            {!noCatalogo && <option value={valor}>{valor} (custom)</option>}
            {MODELOS_NVIDIA.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </select>
        ) : (
          <Input
            id={`modelo-${chave}`}
            value={valor}
            onChange={(e) => ajustarModelo(chave, e.target.value)}
            className="h-8 text-xs"
          />
        )}
      </div>
    );
  };

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajustes do império</DialogTitle>
          <DialogDescription>
            Motor híbrido: a engine local calcula todos os números. A IA pensa o mundo, os chats e o
            conselho — cada função com o modelo que você escolher.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 p-3">
            <div>
              <Label htmlFor="ia-on">Inteligência artificial</Label>
              <p className="text-xs text-muted-foreground">
                Desligado = mundo 100% local e determinístico. Ligado = eventos, Axiom, Sofia e
                conselho pensados pela API NVIDIA (ou pelo provedor configurado).
              </p>
            </div>
            <Switch
              id="ia-on"
              checked={cfg.habilitada}
              onCheckedChange={(v) => ajustarConfig({ habilitada: v })}
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => trocarProvedor("nvidia")}
              className={`rounded-lg border p-3 text-left transition-colors ${
                cfg.provedor === "nvidia"
                  ? "border-primary bg-primary/10"
                  : "border-border/60 bg-background/40 hover:border-primary/50"
              }`}
            >
              <div className="text-sm font-semibold">NVIDIA NIM</div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                GPT-OSS 20B + Nemotron. Compatível com OpenAI, catálogo gratuito (rate-limited).
              </p>
            </button>
            <button
              type="button"
              onClick={() => trocarProvedor("custom")}
              className={`rounded-lg border p-3 text-left transition-colors ${
                cfg.provedor === "custom"
                  ? "border-primary bg-primary/10"
                  : "border-border/60 bg-background/40 hover:border-primary/50"
              }`}
            >
              <div className="text-sm font-semibold">OpenAI-compatível</div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Qualquer endpoint /chat/completions: OpenAI, Groq, OpenRouter, Ollama, LM Studio.
              </p>
            </button>
          </div>

          {cfg.provedor === "nvidia" && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground">
              Chave grátis em{" "}
              <a
                href="https://build.nvidia.com"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-primary underline-offset-2 hover:underline"
              >
                build.nvidia.com
              </a>{" "}
              (começa com <code>nvapi-</code>). O tier gratuito tem limite de requisições; se
              estourar, o jogo cai sozinho no motor local sem perder turno.
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="key">Chave de API (opcional)</Label>
            <Input
              id="key"
              type="password"
              value={cfg.apiKey}
              onChange={(e) => ajustarConfig({ apiKey: e.target.value })}
              placeholder={cfg.provedor === "nvidia" ? "nvapi-… (ou deixe vazio)" : "sk-…"}
            />
            <p className="text-[11px] text-muted-foreground">
              {chaveServidor
                ? "Chave NVIDIA do servidor ativa — pode deixar este campo vazio."
                : "Se ficar vazia, o proxy usa NVIDIA_API_KEY do servidor. A chave do navegador fica só no localStorage."}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="base">Base URL</Label>
            <Input
              id="base"
              value={cfg.baseUrl}
              onChange={(e) => ajustarConfig({ baseUrl: e.target.value })}
              placeholder={BASE_NVIDIA}
            />
          </div>

          <div className="rounded-lg border border-border/60 bg-background/40 p-3">
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                Modelo por função
              </span>
              <span className="text-[11px] text-muted-foreground">
                {cfg.provedor === "nvidia"
                  ? "GPT-OSS em todas as funções · Lightning opcional"
                  : ""}
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {(Object.keys(NOMES_MODELOS) as (keyof ModelosIA)[]).map(campoModelo)}
            </div>
            {cfg.provedor === "nvidia" && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                GPT-OSS 20B é o padrão em todas as funções: JSON consistente e resposta garantida.
                Lightning é rápido, mas o reasoning pode consumir o limite de tokens. DeepSeek e
                Nemotron Super podem enfileirar ou não estar liberados na tua conta.
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => void rodarTeste()}
              disabled={teste.estado === "rodando"}
            >
              {teste.estado === "rodando" ? "Testando…" : "Testar conexão"}
            </Button>
            {teste.detalhe && (
              <span
                className={`text-xs ${
                  teste.estado === "ok"
                    ? "text-cyan-300"
                    : teste.estado === "erro"
                      ? "text-destructive"
                      : "text-muted-foreground"
                }`}
              >
                {teste.detalhe}
              </span>
            )}
          </div>

          <div className="rounded-lg border border-border/60 bg-background/40 p-3 text-xs text-muted-foreground">
            Memória oculta: roleplat.txt com {loreLinhas.toLocaleString("pt-BR")} linhas embutido no
            bundle. Cada chamada busca os trechos relevantes pra manter continuidade.
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
                  setMsg("Resetado — turno 0, janeiro de 2027.");
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
