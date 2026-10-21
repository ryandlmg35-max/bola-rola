import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Brain,
  Building2,
  CalendarDays,
  Cpu,
  Gavel,
  Home,
  MapPin,
  Newspaper,
  Pause,
  Play,
  Radio,
  Send,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRP } from "./store";
import { fmtUSD } from "./engine";
import { loreLinhas } from "./lore";
import { Ajustes } from "./Ajustes";
import { ChatSofia } from "./ChatSofia";
import { ChatAxiom } from "./ChatAxiom";
import { ChatCEO } from "./ChatCEO";
import { JornalTimes } from "./JornalTimes";
import { ReuniaoMes } from "./ReuniaoMes";
import { Cena3D } from "./Cena3D";
import { MapaSedes } from "./MapaSedes";
import { FamiliaMR } from "./FamiliaMR";
import { formatarMes, intervaloDaSemana, mesFechado } from "./calendario";
import { ConviteReuniaoCard } from "./ConviteReuniaoCard";
import { ViagemDialog } from "./ViagemDialog";
import { CasaGreenwich } from "./CasaGreenwich";
import { ChatGeral } from "./ChatGeral";
import { ReuniaoExtra } from "./ReuniaoExtra";
import { localPorId } from "./viagens";
import { humorSofia } from "./sofia";
import { perfilPorId } from "./ceos";
import { motorAudio } from "./som";
import type { Divisao, EntradaFeed, StatusDiv } from "./types";

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

function Cartao({
  e,
  isLatest,
  heat,
  moral,
  aprovacao,
  onEscolher,
}: {
  e: EntradaFeed;
  isLatest?: boolean;
  heat?: number;
  moral?: number;
  aprovacao?: number;
  onEscolher: (r: string) => void;
}) {
  const emCrise = !!(isLatest && (heat ?? 0) > 70);
  const lucroAlto = !!((e.delta.coin ?? 0) > 3 || (e.delta.holding ?? 0) > 20);

  const bordaClasse = emCrise
    ? "border-destructive/70 shadow-destructive/20 shadow-lg"
    : lucroAlto
      ? "border-ouro/60 shadow-ouro/20 shadow-lg"
      : "border-border/60 shadow-black/20 shadow-lg";

  return (
    <article className={`rounded-2xl border bg-card p-5 ${bordaClasse}`}>
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
        {emCrise && (
          <Badge variant="destructive" className="animate-pulse">
            🔥 CRISE
          </Badge>
        )}
        {isLatest && (moral ?? 50) < 40 && (
          <Badge className="border-amber-400/50 bg-amber-500/20 text-amber-300">⚠️ VESTIÁRIO</Badge>
        )}
        {isLatest && (aprovacao ?? 50) < 35 && (
          <Badge className="border-destructive/50 bg-destructive/20 text-destructive">
            📉 IMPOPULAR
          </Badge>
        )}
        {lucroAlto && <Badge className="border-ouro/50 bg-ouro/20 text-ouro">💰 ALTA FORTE</Badge>}
      </header>
      <h2 className="mb-2 text-xl font-bold text-foreground">{e.titulo}</h2>
      <p className="whitespace-pre-line text-[15px] leading-relaxed text-foreground/85">{e.cena}</p>

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

const STATUS_DIV: Record<StatusDiv, { label: string; cls: string }> = {
  estavel: { label: "Estável", cls: "border-primary/40 bg-primary/15 text-primary" },
  crescendo: { label: "Crescendo", cls: "border-cyan-400/40 bg-cyan-500/15 text-cyan-300" },
  prejuizo: { label: "Prejuízo", cls: "border-destructive/50 bg-destructive/15 text-destructive" },
  instavel: { label: "Instável", cls: "border-amber-400/40 bg-amber-500/15 text-amber-300" },
  geladeira: { label: "Na geladeira", cls: "border-slate-400/30 bg-slate-500/15 text-slate-300" },
  congelada: { label: "Congelada", cls: "border-slate-400/30 bg-slate-500/10 text-slate-400" },
  operando: { label: "Em operação", cls: "border-violet-400/40 bg-violet-500/15 text-violet-300" },
};

/** Card de divisão — clique abre o mapa 3D da sede. Botão "Falar" abre chat com CEO. */
function CartaoDiv({
  d,
  onClicar,
  onFalarCEO,
}: {
  d: Divisao;
  onClicar: () => void;
  onFalarCEO?: () => void;
}) {
  const s = STATUS_DIV[d.status];
  const temCEO = perfilPorId(d.id) !== undefined;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClicar}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClicar();
        }
      }}
      className="w-full cursor-pointer rounded-xl border border-border/50 bg-background/40 p-3 text-left transition-colors hover:border-primary/50 hover:bg-background/70"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-[13px] font-bold leading-tight">{d.nome}</div>
          <div className="truncate text-[11px] text-muted-foreground">
            {d.ceo === "—" ? (
              "Sem CEO nomeado"
            ) : (
              <>
                <span className="font-semibold text-foreground/80">{d.ceo}</span> · CEO
              </>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${s.cls}`}>
            {s.label}
          </span>
          {temCEO && onFalarCEO && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onFalarCEO();
              }}
              className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[9px] font-semibold text-primary transition-colors hover:bg-primary/20"
            >
              💬 Falar
            </button>
          )}
        </div>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1 border-t border-border/40 pt-2 text-center">
        <div>
          <div className="text-[9px] uppercase tracking-wide text-muted-foreground">Sede</div>
          <div className="text-[12px] font-semibold">{d.pais}</div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-wide text-muted-foreground">
            Receita/mês
          </div>
          <div className="text-[12px] font-semibold text-primary">{d.receita}</div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-wide text-muted-foreground">Lucro/mês</div>
          <div
            className={`text-[12px] font-semibold ${
              d.lucro.startsWith("-")
                ? "text-destructive"
                : d.lucro === "—"
                  ? "text-muted-foreground"
                  : "text-cyan-300"
            }`}
          >
            {d.lucro}
          </div>
        </div>
      </div>
      <p className="mt-1.5 truncate text-[11px] text-muted-foreground" title={d.nota}>
        {d.nota}
      </p>
    </div>
  );
}

export function Painel() {
  const {
    estado,
    pensando,
    enviar,
    falarNoGeral,
    avancarSemana,
    hidratar,
    marcarLidas,
    dispensarConvite,
    viajarPara,
    entrarNaReuniao,
  } = useRP();
  const [texto, setTexto] = useState("");
  const [ajustesAbertos, setAjustesAbertos] = useState(false);
  const [sofiaAberta, setSofiaAberta] = useState(false);
  const [axiomAberto, setAxiomAberto] = useState(false);
  const [reuniaoAberta, setReuniaoAberta] = useState(false);
  const [sedeAberta, setSedeAberta] = useState<string | null>(null);
  const [viagemDestino, setViagemDestino] = useState<string | null>(null);
  const [casaAberta, setCasaAberta] = useState(false);
  const [chatGeralAberto, setChatGeralAberto] = useState(false);
  const [reuniaoExtraAberta, setReuniaoExtraAberta] = useState(false);
  const [aba, setAba] = useState<"imperio" | "familia">("imperio");
  const [auto, setAuto] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [ceoDivisaoAberta, setCeoDivisaoAberta] = useState<string | null>(null);
  const [jornalAberto, setJornalAberto] = useState(false);
  const [somAtivo, setSomAtivo] = useState(false);
  const [breaking, setBreaking] = useState<{ texto: string; tipo: "critico" | "positivo" } | null>(
    null,
  );
  const [isNight, setIsNight] = useState(() => {
    const h = new Date().getHours();
    return h >= 22 || h < 6;
  });
  const feedRef = useRef<HTMLDivElement>(null);
  const hidratado = useRef(false);
  const feedLenPrev = useRef(estado.feed.length);

  // Modo do campo de texto: "ordem" = ação de gestão que gasta semana;
  // "conversa" = fala pública com o Axiom no feed, sem gastar semana.
  const modoConversa = texto.startsWith("/") || texto.startsWith(">");

  const cal = estado.calendario;
  const semanaFinal = mesFechado(cal);
  const iaLigada = estado.config.habilitada;
  const localAtual = localPorId(estado.localizacao);
  const noLocalDoConvite = estado.convite?.localId === estado.localizacao;

  useEffect(() => {
    if (!hidratado.current) {
      hidratar();
      hidratado.current = true;
    }
  }, [hidratar]);

  useEffect(() => {
    if (!aviso) return;
    const t = window.setTimeout(() => setAviso(null), 6500);
    return () => window.clearTimeout(t);
  }, [aviso]);

  // Modo noite: 22h–06h
  useEffect(() => {
    const check = () => {
      const h = new Date().getHours();
      setIsNight(h >= 22 || h < 6);
    };
    check();
    const t = window.setInterval(check, 60_000);
    return () => window.clearInterval(t);
  }, []);

  // Breaking news: quando um novo item de feed aparece com efeitos extremos
  useEffect(() => {
    if (estado.feed.length === feedLenPrev.current) return;
    feedLenPrev.current = estado.feed.length;
    const ultimo = estado.feed[0];
    if (!ultimo) return;
    const d = ultimo.delta;
    let msg: string | null = null;
    let tipo: "critico" | "positivo" = "positivo";
    if (Math.abs(d.coin ?? 0) >= 4) {
      msg = `📡 BREAKING — Space Coin ${(d.coin ?? 0) > 0 ? "dispara" : "despenca"} $${Math.abs(d.coin ?? 0).toFixed(2)}`;
      tipo = (d.coin ?? 0) > 0 ? "positivo" : "critico";
    } else if (Math.abs(d.holding ?? 0) >= 25) {
      msg = `📡 BREAKING — Patrimônio ${(d.holding ?? 0) > 0 ? "sobe" : "cai"} ${fmtUSD(Math.abs(d.holding ?? 0))}`;
      tipo = (d.holding ?? 0) > 0 ? "positivo" : "critico";
    } else if ((d.heat ?? 0) >= 8) {
      msg = "📡 BREAKING — Alerta de imprensa: heat crítico";
      tipo = "critico";
    } else if ((d.aprovacao ?? 0) >= 7) {
      msg = "📡 BREAKING — Aprovação popular dispara";
      tipo = "positivo";
    }
    if (!msg) return;
    setBreaking({ texto: msg, tipo });
    const timer = window.setTimeout(() => setBreaking(null), 8000);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado.feed.length]);

  useEffect(() => {
    if (!auto) return;
    if (semanaFinal) {
      setAuto(false);
      setAviso("Mês fechado. Convoca o conselho pra virar o mês.");
      return;
    }
    // Auto modo: não pausa mais quando modais estão abertos.
    // Só pausa se já está processando outro turno.
    if (pensando) return;
    const t = window.setTimeout(() => {
      void avancarSemana(true).then((r) => {
        if (r === "mes") {
          setAuto(false);
          setAviso("Mês fechado. Convoca o conselho pra virar o mês.");
        }
      });
    }, 60_000);
    return () => window.clearTimeout(t);
  }, [auto, pensando, semanaFinal, estado.turno, avancarSemana]);

  // Sincroniza ambiente sonoro quando localização ou heat muda
  useEffect(() => {
    if (somAtivo) {
      motorAudio.atualizar(estado.localizacao, estado.heat);
    }
  }, [somAtivo, estado.localizacao, estado.heat]);

  const alternarSom = () => {
    const ligado = motorAudio.alternar(estado.localizacao, estado.heat);
    setSomAtivo(ligado);
  };

  const mandar = async () => {
    const t = texto;
    setTexto("");
    if (modoConversa) {
      // Remove o prefixo / ou > e manda pro canal aberto do 130º.
      const fala = t.replace(/^[/>]\s*/, "").trim();
      if (fala) {
        setChatGeralAberto(true);
        await falarNoGeral(fala);
      }
    } else {
      await enviar(t);
    }
  };

  const avancar = async () => {
    const r = await avancarSemana(false);
    if (r === "mes") setAviso("Mês fechado. Convoca o conselho pra virar o mês.");
    if (r === "ocupado") setAviso("O mundo ainda tá processando a última semana.");
  };

  const abrirSofia = () => {
    setSofiaAberta(true);
    marcarLidas("sofia");
  };
  const abrirAxiom = () => {
    setAxiomAberto(true);
    marcarLidas("axiom");
  };

  const abrirReuniao = () => {
    const atual = useRP.getState().estado;
    const convite = atual.convite;
    setSofiaAberta(false);
    setAxiomAberto(false);
    if (!convite) return;
    if (convite.localId === atual.localizacao) {
      if (entrarNaReuniao()) setReuniaoExtraAberta(true);
      return;
    }
    setViagemDestino(convite.localId);
  };

  const irParaCasa = () => {
    if (estado.localizacao === "casa") {
      setCasaAberta(true);
      return;
    }
    setSofiaAberta(false);
    setAxiomAberto(false);
    setViagemDestino("casa");
  };

  const irParaBase = () => {
    if (estado.localizacao === "tower") {
      setAviso("Você já está na base, no 130º andar.");
      return;
    }
    setCasaAberta(false);
    setViagemDestino("tower");
  };

  const concluirViagem = (destinoId: string, veiculoId: string) => {
    const ok = viajarPara(destinoId, veiculoId);
    setViagemDestino(null);
    if (!ok) {
      setAviso("Esse veículo não alcança o destino. Escolhe outro.");
      return;
    }
    const novo = useRP.getState().estado;
    if (novo.reuniaoAtual) {
      setCasaAberta(false);
      setReuniaoExtraAberta(true);
    } else if (novo.localizacao === "casa") {
      setCasaAberta(true);
    }
    setAviso(`Chegou em ${localPorId(novo.localizacao).nome}.`);
  };

  const vivas = estado.pendencias.filter((p) => p.ativa);
  const pares = Object.entries(estado.relacoes).sort((a, b) => b[1] - a[1]);
  const naoLidas = estado.naoLidas.sofia + estado.naoLidas.axiom;

  return (
    <div className={`min-h-screen bg-background text-foreground${isNight ? " night-mode" : ""}`}>
      {/* TOP BAR */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
          <div className="mr-2">
            <div className="text-lg font-black tracking-tight">
              SPACE <span className="text-primary">·</span> IMPÉRIO MR
            </div>
            <div className="text-[11px] text-muted-foreground">
              {isNight
                ? `🌙 Madrugada · 130º · semana ${cal.semana}/4`
                : `Ryan Dalbert · Chairman · semana ${cal.semana}/4`}
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
          <div className="flex items-center gap-1.5">
            <span
              className="flex items-center gap-1 rounded-full border border-border/60 bg-background/50 px-2.5 py-1 text-[10px] font-semibold text-muted-foreground"
              title={`Localização atual: ${localAtual.nome}`}
            >
              <MapPin className="h-3 w-3 text-ouro" />
              {localAtual.tipo === "casa"
                ? "Casa · Greenwich"
                : localAtual.tipo === "base"
                  ? "Base · Manhattan"
                  : localAtual.cidade}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={irParaCasa}
              title={estado.localizacao === "casa" ? "Abrir a casa" : "Ir para Greenwich"}
            >
              <Home className="mr-1 h-3.5 w-3.5" /> Casa
            </Button>
            {estado.localizacao !== "tower" && (
              <Button size="sm" variant="outline" onClick={irParaBase} title="Voltar pra base">
                <Building2 className="mr-1 h-3.5 w-3.5" /> Base
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="relative gap-1 border-primary/40 bg-primary/10 text-primary"
              onClick={() => setChatGeralAberto(true)}
              title="Canal aberto do 130º — todo império ouve"
            >
              <Radio className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Chat</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="relative"
              onClick={abrirAxiom}
              title="Chat com o Axiom"
            >
              Axiom
              {estado.naoLidas.axiom > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                  {estado.naoLidas.axiom}
                </span>
              )}
            </Button>
            {(() => {
              const h = humorSofia(estado.sofia);
              const corBadge =
                h.tom === "derretendo"
                  ? "border-rose-400/40 bg-rose-500/15 text-rose-300"
                  : h.tom === "calorosa"
                    ? "border-primary/40 bg-primary/15 text-primary"
                    : h.tom === "tensa"
                      ? "border-amber-400/40 bg-amber-500/15 text-amber-300"
                      : h.tom === "limite"
                        ? "border-destructive/50 bg-destructive/15 text-destructive"
                        : h.tom === "congelada"
                          ? "border-cyan-400/40 bg-cyan-500/15 text-cyan-300"
                          : "border-border/60 bg-card/60 text-muted-foreground";
              const emoji =
                h.tom === "derretendo"
                  ? "❤️"
                  : h.tom === "calorosa"
                    ? "🌹"
                    : h.tom === "tensa"
                      ? "😤"
                      : h.tom === "limite"
                        ? "⚠️"
                        : h.tom === "congelada"
                          ? "🧊"
                          : "📊";
              return (
                <span
                  className={`hidden sm:inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold ${corBadge}`}
                  title={`Sofia: ${h.label} (Estresse ${estado.sofia.estresse}%, Energia ${estado.sofia.energia}%)`}
                >
                  <span>{emoji}</span> {h.label}
                </span>
              );
            })()}
            <Button
              size="sm"
              variant="outline"
              className="relative"
              onClick={abrirSofia}
              title="Chat com a Sofia"
            >
              Sofia
              {estado.naoLidas.sofia > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ouro px-1 text-[9px] font-bold text-black">
                  {estado.naoLidas.sofia}
                </span>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setJornalAberto(true)}
              title="Abrir o jornal The MR Times"
              className="gap-1 font-serif"
            >
              <Newspaper className="h-3.5 w-3.5 text-ouro" />
              <span className="hidden sm:inline">MR Times</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={alternarSom}
              title={
                somAtivo ? "Desativar trilha sonora ambiente" : "Ativar trilha sonora ambiente"
              }
              className={`gap-1 ${somAtivo ? "border-primary text-primary" : "text-muted-foreground"}`}
            >
              {somAtivo ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{somAtivo ? "Som ON" : "Som"}</span>
            </Button>
            <Button size="sm" variant="outline" onClick={() => setAjustesAbertos(true)}>
              ⚙ Ajustes
            </Button>
          </div>
        </div>

        {/* CALENDÁRIO & TEMPO */}
        <div className="border-t border-border/50 bg-card/40">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-2">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold">{formatarMes(cal)}</span>
              <span className="hidden text-[11px] text-muted-foreground sm:inline">
                {intervaloDaSemana(cal)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4].map((s) => (
                <span
                  key={s}
                  className={`h-1.5 w-6 rounded-full ${
                    s <= cal.semana ? "bg-primary" : "bg-muted/40"
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] font-semibold text-muted-foreground">
              semana {cal.semana}/4
            </span>
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                estado.mundo.tensao >= 70
                  ? "border-destructive/50 bg-destructive/15 text-destructive"
                  : estado.mundo.tensao >= 45
                    ? "border-amber-400/40 bg-amber-500/10 text-amber-300"
                    : "border-primary/40 bg-primary/10 text-primary"
              }`}
            >
              conselho {estado.mundo.tensao}/100 · {estado.mundo.clima}
            </span>

            <div className="ml-auto flex flex-wrap items-center gap-1.5">
              {naoLidas > 0 && (
                <span className="text-[10px] text-muted-foreground">
                  {naoLidas} mensagem(ns) nova(s)
                </span>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => void avancar()}
                disabled={pensando || semanaFinal}
                title={
                  semanaFinal ? "O mês fechou — hora do conselho" : "Deixa o mundo andar uma semana"
                }
              >
                {pensando ? "Rodando…" : semanaFinal ? "Semana final" : "Avançar semana"}
              </Button>
              <Button
                size="sm"
                variant={auto ? "default" : "outline"}
                onClick={() => setAuto((v) => !v)}
                disabled={semanaFinal}
                title="O RP avança sozinho a cada 20s"
              >
                {auto ? (
                  <Pause className="mr-1 h-3.5 w-3.5" />
                ) : (
                  <Play className="mr-1 h-3.5 w-3.5" />
                )}
                Auto
              </Button>
              <Button
                size="sm"
                onClick={() => setReuniaoAberta(true)}
                disabled={!semanaFinal}
                className="bg-ouro font-bold text-black hover:bg-ouro/90 disabled:opacity-40"
                title={semanaFinal ? "Fechar o mês com o conselho" : "Disponível na semana 4"}
              >
                <Gavel className="mr-1 h-3.5 w-3.5" />
                Fechar mês
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-4 px-4 pb-1 pt-5">
        {/* ABAS */}
        <div className="inline-flex rounded-xl border border-border/60 bg-card/60 p-1">
          <button
            type="button"
            onClick={() => setAba("imperio")}
            className={`cursor-pointer rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${
              aba === "imperio"
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Império Space
          </button>
          <button
            type="button"
            onClick={() => setAba("familia")}
            className={`cursor-pointer rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${
              aba === "familia"
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Família MR
          </button>
        </div>

        {estado.convite && (
          <ConviteReuniaoCard
            convite={estado.convite}
            noLocal={noLocalDoConvite}
            onIr={abrirReuniao}
            onDispensar={dispensarConvite}
          />
        )}

        {estado.reuniaoAtual && !reuniaoExtraAberta && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ouro/40 bg-ouro/10 px-4 py-3">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-ouro">
                <Gavel className="h-3.5 w-3.5" /> Reunião em andamento
              </div>
              <div className="text-sm font-bold">{estado.reuniaoAtual.titulo}</div>
              <div className="text-[11px] text-muted-foreground">
                {estado.reuniaoAtual.participantes.join(" · ")} · {estado.reuniaoAtual.quando}
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => setReuniaoExtraAberta(true)}
              className="bg-ouro font-bold text-black hover:bg-ouro/90"
            >
              Retomar reunião
            </Button>
          </div>
        )}

        {aba === "imperio" && (
          <>
            {/* HERO 3D — torre + globo do império */}
            <section className="relative h-44 overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-blue-950/70 via-card to-background">
              <Cena3D />
              <div className="relative z-10 flex h-full flex-col justify-center gap-1 px-7">
                <div className="text-2xl font-black tracking-tight">
                  O mundo gira em volta da torre.
                </div>
                <div className="text-sm text-muted-foreground">
                  Holding de {fmtUSD(estado.holding)} · {estado.divisoes.length} divisões · Ryan
                  Dalbert, Chairman
                </div>
                <button
                  type="button"
                  onClick={() => setSedeAberta("tower")}
                  className="mt-1.5 w-fit cursor-pointer rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/20"
                >
                  🏢 Space Group Tower — sede principal, Nova York
                </button>
              </div>
            </section>

            {/* DIVISÕES — organizadas */}
            <section className="rounded-2xl border border-border/60 bg-card/60 p-4">
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-1">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                  Divisões · Space Group
                </h3>
                <span className="text-[11px] text-muted-foreground">
                  CEO · sede · receita e lucro por mês · status atual
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {estado.divisoes.map((d) => (
                  <CartaoDiv
                    key={d.id}
                    d={d}
                    onClicar={() => setSedeAberta(d.id)}
                    onFalarCEO={() => setCeoDivisaoAberta(d.id)}
                  />
                ))}
              </div>
            </section>

            {semanaFinal && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ouro/40 bg-ouro/10 px-4 py-3">
                <div>
                  <div className="text-sm font-bold text-ouro">
                    O mês de {formatarMes(cal)} fechou.
                  </div>
                  <div className="text-[12px] text-muted-foreground">
                    Os CEOs estão subindo pro 130º andar. Fecha o mês pra ver o resultado, pagar
                    dividendo e escolher a diretriz do próximo.
                  </div>
                </div>
                <Button
                  onClick={() => setReuniaoAberta(true)}
                  className="bg-ouro font-bold text-black hover:bg-ouro/90"
                >
                  <Gavel className="mr-1 h-4 w-4" /> Convocar conselho
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {aba === "imperio" ? (
        <main className="mx-auto grid max-w-7xl gap-4 px-4 pb-8 xl:grid-cols-[260px_1fr_260px]">
          {/* ESQUERDA — PENDÊNCIAS */}
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
          </aside>

          {/* CENTRO — FEED + AÇÃO */}
          <section className="flex min-h-[60vh] flex-col gap-4">
            <div ref={feedRef} className="flex-1 space-y-4">
              {breaking && (
                <div
                  className={`animate-pulse rounded-xl border px-4 py-2.5 text-xs font-bold shadow-lg ${
                    breaking.tipo === "critico"
                      ? "border-destructive/60 bg-destructive/20 text-destructive shadow-destructive/20"
                      : "border-ouro/60 bg-ouro/20 text-ouro shadow-ouro/20"
                  }`}
                >
                  {breaking.texto}
                </div>
              )}
              {estado.feed.map((e, idx) => (
                <Cartao
                  key={e.id}
                  e={e}
                  isLatest={idx === 0}
                  heat={estado.heat}
                  moral={estado.moral}
                  aprovacao={estado.aprovacao}
                  onEscolher={(r) => {
                    if (semanaFinal) {
                      setAviso("Mês fechado. A próxima ordem é no conselho.");
                      return;
                    }
                    void enviar(r);
                  }}
                />
              ))}
              {pensando && (
                <div className="rounded-2xl border border-border/60 bg-card p-6 text-center text-sm text-muted-foreground">
                  O mundo tá rodando — IA pensando a semana, engine fechando os números…
                </div>
              )}
            </div>

            <div className="sticky bottom-3 z-20 rounded-2xl border border-primary/30 bg-card/95 p-3 shadow-2xl shadow-black/40 backdrop-blur">
              {/* Indicador de modo */}
              <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider">
                <button
                  type="button"
                  onClick={() =>
                    setTexto((v) =>
                      v.startsWith("/") || v.startsWith(">") ? v.replace(/^[/>]\s*/, "") : `/ ${v}`,
                    )
                  }
                  className={`rounded-full border px-2.5 py-0.5 transition-colors ${
                    !modoConversa
                      ? "border-primary/60 bg-primary/20 text-primary"
                      : "border-border/50 bg-background/40 text-muted-foreground"
                  }`}
                >
                  ⚡ Ordem
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setTexto((v) => (v.startsWith("/") || v.startsWith(">") ? v : `/ ${v}`))
                  }
                  className={`rounded-full border px-2.5 py-0.5 transition-colors ${
                    modoConversa
                      ? "border-primary/60 bg-primary/20 text-primary"
                      : "border-border/50 bg-background/40 text-muted-foreground"
                  }`}
                >
                  💬 Chat geral
                </button>
                <span className="ml-auto text-muted-foreground normal-case font-normal">
                  {modoConversa
                    ? "Canal aberto do 130º — Axiom responde, todo império ouve e reage."
                    : "Gasta uma semana do calendário."}
                </span>
              </div>
              <Textarea
                value={texto}
                onChange={(ev) => setTexto(ev.target.value)}
                onKeyDown={(ev) => {
                  if (ev.key === "Enter" && !ev.shiftKey) {
                    ev.preventDefault();
                    void mandar();
                  }
                }}
                placeholder={
                  semanaFinal
                    ? "Mês fechado. Convoca o conselho pra virar o mês — nova ordem só depois."
                    : modoConversa
                      ? "/ Fala no canal aberto do 130º… (o Axiom responde, o império escuta e reage)"
                      : "O que você manda fazer, boss man?  (ex.: gastar 500 milhões na Ilha MR · chamar o INDEX · acelerar a PEC)  — cada ordem custa uma semana."
                }
                className="mb-2 min-h-[64px] resize-none bg-background/60"
                rows={2}
                disabled={semanaFinal || pensando}
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">
                  {semanaFinal
                    ? "Tempo parado no fim do mês — decisão é no conselho."
                    : "Enter envia · Shift+Enter quebra linha · / ou > = modo conversa"}
                </span>
                <Button
                  size="sm"
                  onClick={() => void mandar()}
                  disabled={pensando || semanaFinal || !texto.trim()}
                >
                  <Send className="mr-1 h-4 w-4" /> {modoConversa ? "FALAR" : "MANDAR"}
                </Button>
              </div>
            </div>
          </section>

          {/* DIREITA — CONSELHO + PLANO + RELAÇÕES */}
          <aside className="space-y-4">
            <section className="rounded-2xl border border-border/60 bg-card p-4">
              <h3 className="mb-2 flex items-baseline justify-between text-[11px] font-semibold uppercase tracking-wider text-primary">
                Conselho & atritos
                <span className="text-[10px] font-normal text-muted-foreground">
                  {estado.mundo.tensao}/100
                </span>
              </h3>
              <div className="mb-2">
                <Barra
                  label="Tensão"
                  valor={estado.mundo.tensao}
                  cor={
                    estado.mundo.tensao >= 70
                      ? "bg-destructive"
                      : estado.mundo.tensao >= 45
                        ? "bg-amber-400"
                        : "bg-primary"
                  }
                />
              </div>
              <div className="space-y-2">
                {estado.mundo.conflitos.map((c) => (
                  <div key={c.id}>
                    <div className="text-[11px] leading-tight text-foreground/80">
                      <span className="font-semibold">{c.entre}</span> × {c.sobre}
                    </div>
                    <div className="mt-1 h-1 rounded-full bg-muted/40">
                      <div
                        className="h-1 rounded-full bg-amber-400/80"
                        style={{ width: `${Math.min(100, c.nivel)}%` }}
                      />
                    </div>
                  </div>
                ))}
                {estado.mundo.conflitos.length === 0 && (
                  <p className="text-[11px] text-muted-foreground">
                    Nenhum atrito aberto. Silêncio suspeito.
                  </p>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-border/60 bg-card p-4">
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-primary">
                Plano do mês
              </h3>
              <div className="text-[13px] font-semibold">{estado.plano.diretriz}</div>
              <div className="mt-1 flex gap-2 text-[11px] text-muted-foreground">
                <span>receita ×{estado.plano.receitaMult.toFixed(2)}</span>
                <span>lucro ×{estado.plano.lucroMult.toFixed(2)}</span>
              </div>
              <div className="mt-2 text-[11px] text-muted-foreground">
                Fechamento em{" "}
                {semanaFinal
                  ? "agora — conselho convocado"
                  : `${4 - cal.semana} semana(s), na virada do mês`}
                .
              </div>
            </section>

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
                roleplat.txt inteiro embutido — {loreLinhas.toLocaleString("pt-BR")} linhas, oculto
                da interface, usado como contexto da IA em cada semana.
              </p>
              <Badge variant="outline" className="mt-2 text-[10px] text-muted-foreground">
                {iaLigada
                  ? `IA ON · ${estado.config.modelos.mundo.split("/").pop()}`
                  : "IA OFF · mundo local"}
              </Badge>
            </section>
          </aside>
        </main>
      ) : (
        <FamiliaMR onAbrirSofia={abrirSofia} />
      )}

      <Ajustes aberto={ajustesAbertos} onFechar={() => setAjustesAbertos(false)} />
      <ChatSofia
        aberto={sofiaAberta}
        onFechar={() => setSofiaAberta(false)}
        onIrParaReuniao={abrirReuniao}
      />
      <ChatAxiom
        aberto={axiomAberto}
        onFechar={() => setAxiomAberto(false)}
        onIrParaReuniao={abrirReuniao}
      />
      <ChatGeral
        aberto={chatGeralAberto}
        onFechar={() => setChatGeralAberto(false)}
        onIrParaReuniao={abrirReuniao}
      />
      <ChatCEO divisaoId={ceoDivisaoAberta} onFechar={() => setCeoDivisaoAberta(null)} />
      <JornalTimes aberto={jornalAberto} onFechar={() => setJornalAberto(false)} estado={estado} />
      <ReuniaoMes aberto={reuniaoAberta} onFechar={() => setReuniaoAberta(false)} />
      <ViagemDialog
        destino={viagemDestino}
        onFechar={() => setViagemDestino(null)}
        onConcluir={concluirViagem}
      />
      <CasaGreenwich
        aberto={casaAberta}
        onFechar={() => setCasaAberta(false)}
        onVoltarBase={irParaBase}
      />
      <ReuniaoExtra aberto={reuniaoExtraAberta} onFechar={() => setReuniaoExtraAberta(false)} />
      <MapaSedes
        sedeAberta={sedeAberta}
        onFechar={() => setSedeAberta(null)}
        onSelecionar={setSedeAberta}
      />

      {aviso && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm rounded-xl border border-primary/40 bg-card px-4 py-3 text-sm text-foreground shadow-2xl">
          {aviso}
        </div>
      )}
    </div>
  );
}
