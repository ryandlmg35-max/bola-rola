import { useEffect, useRef, useState, type ReactNode } from "react";
import { Send, Brain, Cpu } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRP } from "./store";
import { fmtUSD } from "./engine";
import { loreLinhas } from "./lore";
import { Ajustes } from "./Ajustes";
import { ChatSofia } from "./ChatSofia";
import type { EntradaFeed } from "./types";

function Grupo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border/40 bg-card/50 px-2.5 py-1.5">
      <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {titulo}
      </span>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

function Chip({ label, valor, tom }: { label: string; valor: string; tom?: string }) {
  return (
    <div className="flex flex-col rounded-lg border border-border/60 bg-card/70 px-2.5 py-1">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className={`text-sm font-semibold tabular-nums ${tom ?? "text-foreground"}`}>
        {valor}
      </span>
    </div>
  );
}

function Barra({ label, valor, cor }: { label: string; valor: number; cor: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px] text-muted-foreground">
        <span>{label}</span>
        <span className="tabular-nums">{valor}/100</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted/50">
        <div className={`h-1.5 rounded-full ${cor}`} style={{ width: `${valor}%` }} />
      </div>
    </div>
  );
}

function Cartao({ e, onEscolher }: { e: EntradaFeed; onEscolher: (r: string) => void }) {
  return (
    <article className="rounded-2xl border border-border/60 bg-card p-5 shadow-lg shadow-black/20">
      <header className="mb-3 flex flex-wrap items-center gap-2">
        <Badge className="bg-ouro/20 text-ouro">TURNO {e.turno}</Badge>
        <Badge variant="outline" className="text-muted-foreground">
          {e.data}
        </Badge>
        {e.narradoPor === "ia" ? (
          <Badge variant="outline" className="gap-1 border-primary/40 text-primary">
            <Brain className="h-3 w-3" /> IA
          </Badge>
        ) : (
          <Badge variant="outline" className="gap-1 text-muted-foreground">
            <Cpu className="h-3 w-3" /> ENGINE
          </Badge>
        )}
      </header>
      <h2 className="mb-2 text-xl font-bold text-foreground">{e.titulo}</h2>
      <p className="text-[15px] leading-relaxed text-foreground/85">{e.cena}</p>

      <div className="mt-4 rounded-xl border border-border/50 bg-background/40 p-3">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-primary">
          Consequências
        </div>
        <ul className="space-y-1.5">
          {e.efeitos.map((l, i) => (
            <li key={i} className="flex gap-2 text-[13px] leading-snug text-foreground/80">
              <span className="text-primary/70 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
              <span>{l}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-3 grid gap-1.5 text-[13px]">
        <div>
          <span className="font-semibold text-muted-foreground">MÍDIA — </span>
          {e.reacoes.midia}
        </div>
        <div>
          <span className="font-semibold text-muted-foreground">MERCADO — </span>
          {e.reacoes.mercado}
        </div>
        <div>
          <span className="font-semibold text-muted-foreground">POVO — </span>
          {e.reacoes.povo}
        </div>
      </div>

      {e.escolhas.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {e.escolhas.map((es, i) => (
            <Button
              key={i}
              size="sm"
              variant="outline"
              className="border-primary/30 bg-primary/10 text-[13px] hover:bg-primary/20"
              onClick={() => onEscolher(es.rotulo)}
            >
              {es.rotulo}
            </Button>
          ))}
        </div>
      )}
    </article>
  );
}

export function Painel() {
  const { estado, pensando, enviar, escolher, hidratar } = useRP();
  const [texto, setTexto] = useState("");
  const [ajustesAbertos, setAjustesAbertos] = useState(false);
  const [sofiaAberta, setSofiaAberta] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);
  const hidratado = useRef(false);

  useEffect(() => {
    if (!hidratado.current) {
      hidratar();
      hidratado.current = true;
    }
  }, [hidratar]);

  const mandar = async () => {
    const t = texto;
    setTexto("");
    await enviar(t);
  };

  const vivas = estado.pendencias.filter((p) => p.ativa);
  const pares = Object.entries(estado.relacoes).sort((a, b) => b[1] - a[1]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* TOP BAR */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
          <div className="mr-2">
            <div className="text-lg font-black tracking-tight">
              SPACE <span className="text-primary">·</span> IMPÉRIO MR
            </div>
            <div className="text-[11px] text-muted-foreground">
              Ryan Dalbert · Chairman · {estado.data}
            </div>
          </div>
          <div className="flex flex-1 flex-wrap items-stretch gap-2">
            <Grupo titulo="Ryan Dalbert · pessoal">
              <Chip
                label="Patrimônio (74% da holding)"
                valor={fmtUSD(estado.holding * 0.74 + estado.pessoal)}
                tom="text-ouro"
              />
              <Chip label="Caixa pessoal" valor={fmtUSD(estado.pessoal)} />
            </Grupo>
            <Grupo titulo="Space Group">
              <Chip label="Valor do grupo" valor={fmtUSD(estado.holding)} />
              <Chip label="Caixa livre" valor={fmtUSD(estado.caixa)} tom="text-primary" />
              <Chip label="Cartão corp. ($500mi)" valor={fmtUSD(estado.cartao)} />
            </Grupo>
            <Grupo titulo="Indicadores">
              <Chip
                label="Space Coin"
                valor={`$${estado.coin.toFixed(2).replace(".", ",")}`}
                tom="text-ouro"
              />
              <Chip
                label="Heat"
                valor={`${estado.heat}`}
                tom={estado.heat > 70 ? "text-destructive" : "text-foreground"}
              />
              <Chip label="Moral" valor={`${estado.moral}`} />
              <Chip label="Povo" valor={`${estado.aprovacao}`} />
            </Grupo>
          </div>
          <Button size="sm" variant="outline" onClick={() => setSofiaAberta(true)}>
            💬 Sofia
          </Button>
          <Button size="sm" variant="outline" onClick={() => setAjustesAbertos(true)}>
            ⚙ Ajustes
          </Button>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-5 xl:grid-cols-[260px_1fr_260px]">
        {/* ESQUERDA — PENDÊNCIAS + DIVISÕES */}
        <aside className="space-y-4">
          <section className="rounded-2xl border border-border/60 bg-card p-4">
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-primary">
              Pendências do império
            </h3>
            <div className="space-y-3">
              {vivas.map((p) => (
                <div
                  key={p.id}
                  className="rounded-lg border border-border/50 bg-background/40 p-2.5"
                >
                  <div className="text-[13px] font-semibold">{p.nome}</div>
                  <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                    {p.descricao}
                  </div>
                  <div className="mt-1.5 flex gap-1">
                    {p.etapas.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full ${i <= p.passo ? "bg-primary" : "bg-muted/40"}`}
                      />
                    ))}
                  </div>
                </div>
              ))}
              {vivas.length === 0 && (
                <div className="text-[12px] text-muted-foreground">
                  Nada pendente. O mundo é seu.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-border/60 bg-card p-4">
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-primary">
              Divisões
            </h3>
            <div className="space-y-2">
              {estado.divisoes.map((d) => (
                <div key={d.id} className="text-[12px] leading-snug">
                  <span className="font-semibold">{d.nome}</span>
                  <span className="block text-muted-foreground">{d.nota}</span>
                </div>
              ))}
            </div>
          </section>
        </aside>

        {/* CENTRO — FEED + AÇÃO */}
        <section className="flex min-h-[60vh] flex-col gap-4">
          <div ref={feedRef} className="flex-1 space-y-4">
            {estado.feed.map((e) => (
              <Cartao key={e.id} e={e} onEscolher={escolher} />
            ))}
            {pensando && (
              <div className="rounded-2xl border border-border/60 bg-card p-6 text-center text-sm text-muted-foreground">
                O Axiom tá pensando o próximo movimento…
              </div>
            )}
          </div>

          <div className="sticky bottom-3 z-20 rounded-2xl border border-primary/30 bg-card/95 p-3 shadow-2xl shadow-black/40 backdrop-blur">
            <Textarea
              value={texto}
              onChange={(ev) => setTexto(ev.target.value)}
              onKeyDown={(ev) => {
                if (ev.key === "Enter" && !ev.shiftKey) {
                  ev.preventDefault();
                  void mandar();
                }
              }}
              placeholder="O que você manda fazer, boss man?  (ex.: gastar 500 milhões na Ilha MR · chamar o INDEX · acelerar a PEC)"
              className="mb-2 min-h-[64px] resize-none bg-background/60"
              rows={2}
            />
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">
                Enter envia · Shift+Enter quebra linha · tudo salvo no navegador
              </span>
              <Button size="sm" onClick={() => void mandar()} disabled={pensando || !texto.trim()}>
                <Send className="mr-1 h-4 w-4" /> MANDAR
              </Button>
            </div>
          </div>
        </section>

        {/* DIREITA — RELAÇÕES + MEMÓRIA */}
        <aside className="space-y-4">
          <section className="rounded-2xl border border-border/60 bg-card p-4">
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-primary">
              Vestiário & aliados
            </h3>
            <div className="space-y-2">
              {pares.map(([nome, v]) => (
                <Barra
                  key={nome}
                  label={nome}
                  valor={Math.max(0, v)}
                  cor={v >= 70 ? "bg-primary" : v >= 40 ? "bg-ouro" : "bg-destructive"}
                />
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border/60 bg-card p-4">
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-primary">
              Memória do mundo
            </h3>
            <p className="text-[12px] leading-snug text-muted-foreground">
              roleplat.txt inteiro embutido — {loreLinhas.toLocaleString("pt-BR")} linhas, oculto da
              interface, usado como contexto da IA narradora em cada turno.
            </p>
            <Badge variant="outline" className="mt-2 text-[10px] text-muted-foreground">
              {estado.config.habilitada && estado.config.apiKey
                ? `IA ON · ${estado.config.modelo}`
                : "IA OFF · engine local"}
            </Badge>
          </section>
        </aside>
      </main>

      <Ajustes aberto={ajustesAbertos} onFechar={() => setAjustesAbertos(false)} />
      <ChatSofia aberto={sofiaAberta} onFechar={() => setSofiaAberta(false)} />
    </div>
  );
}
