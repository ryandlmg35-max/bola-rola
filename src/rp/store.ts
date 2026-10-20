import { create } from "zustand";
import type { ConfigIA, EntradaFeed, EstadoRP, MsgChat } from "./types";
import { estadoInicial } from "./estadoInicial";
import { LIMITE_CARTAO, aplicar } from "./engine";
import { narrarPorIA, responderSofiaIA } from "./narrador";
import { respostaLocalSofia } from "./sofia";

const CHAVE_LS = "space-mr-rp-v1";

interface LojaRP {
  estado: EstadoRP;
  pensando: boolean;
  sofiaPensando: boolean;
  enviar: (acao: string) => Promise<void>;
  falarComSofia: (texto: string) => Promise<void>;
  escolher: (rotulo: string) => Promise<void>;
  ajustarConfig: (c: Partial<ConfigIA>) => void;
  resetar: () => void;
  exportar: () => void;
  importar: (json: string) => boolean;
  hidratar: () => void;
}

function salvar(estado: EstadoRP): void {
  try {
    localStorage.setItem(CHAVE_LS, JSON.stringify(estado));
  } catch {
    // quota estourada — a sessão segue em memória
  }
}

function carregar(): EstadoRP | null {
  try {
    const bruto = localStorage.getItem(CHAVE_LS);
    if (!bruto) return null;
    const parsed = JSON.parse(bruto) as EstadoRP;
    if (typeof parsed.turno !== "number" || !Array.isArray(parsed.feed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export const useRP = create<LojaRP>((set, get) => ({
  estado: estadoInicial(),
  pensando: false,
  sofiaPensando: false,

  hidratar: () => {
    const salvo = carregar();
    if (!salvo) return;
    // migração: catálogo (divisões, etapas de pendência, pessoas novas) vem do
    // código — o save só carrega progresso (turno, feed, deltas de relação).
    const inicial = estadoInicial();
    set({
      estado: {
        ...salvo,
        cartao: typeof salvo.cartao === "number" ? salvo.cartao : inicial.cartao,
        chatSofia: Array.isArray(salvo.chatSofia) ? salvo.chatSofia : inicial.chatSofia,
        divisoes: inicial.divisoes,
        relacoes: { ...inicial.relacoes, ...salvo.relacoes },
        pendencias: inicial.pendencias.map((p) => {
          const antiga = salvo.pendencias.find((x) => x.id === p.id);
          return antiga ? { ...p, passo: antiga.passo, ativa: antiga.ativa } : p;
        }),
      },
    });
  },

  enviar: async (acao: string) => {
    const texto = acao.trim();
    if (!texto || get().pensando) return;

    const base = get().estado;
    const entrada = aplicar(base, texto); // números fechados aqui
    set({ pensando: true });

    let final: EntradaFeed = entrada;
    if (base.config.habilitada && base.config.apiKey) {
      const narrado = await narrarPorIA(
        base.config,
        { ...base, ...estadoCom(entrada) },
        entrada,
        texto,
      );
      if (narrado) {
        final = { ...entrada, titulo: narrado.titulo, cena: narrado.cena, narradoPor: "ia" };
      }
    }

    const novo: EstadoRP = {
      ...estadoCom(entrada),
      feed: [final, ...base.feed].slice(0, 200), // histórico local completo no LS; 200 na tela
      seed: (base.seed + (base.turno + 1) * 2654435761) >>> 0,
    };
    salvar(novo);
    set({ estado: novo, pensando: false });
  },

  falarComSofia: async (texto: string) => {
    const t = texto.trim();
    if (!t || get().sofiaPensando) return;

    const base = get().estado;
    const msgRyan: MsgChat = {
      id: `r-${Date.now()}`,
      de: "ryan",
      texto: t,
      turno: base.turno,
    };
    const comRyan = [...base.chatSofia, msgRyan];
    set({ estado: { ...base, chatSofia: comRyan }, sofiaPensando: true });

    let resposta: string | null = null;
    if (base.config.habilitada && base.config.apiKey) {
      resposta = await responderSofiaIA(base.config, base, comRyan, t);
    }
    if (!resposta) resposta = respostaLocalSofia(base, t);

    const msgSofia: MsgChat = {
      id: `s-${Date.now()}`,
      de: "sofia",
      texto: resposta,
      turno: base.turno,
    };
    const atual = get().estado;
    const novo: EstadoRP = {
      ...atual,
      chatSofia: [...atual.chatSofia, msgSofia].slice(-200),
    };
    salvar(novo);
    set({ estado: novo, sofiaPensando: false });
  },

  escolher: async (rotulo: string) => {
    await get().enviar(rotulo.replace(/^→\s*/, ""));
  },

  ajustarConfig: (c) => {
    const estado = { ...get().estado, config: { ...get().estado.config, ...c } };
    salvar(estado);
    set({ estado });
  },

  resetar: () => {
    const estado = estadoInicial();
    salvar(estado);
    set({ estado });
  },

  exportar: () => {
    const blob = new Blob([JSON.stringify(get().estado, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `space-rp-turno-${get().estado.turno}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importar: (json: string) => {
    try {
      const parsed = JSON.parse(json) as EstadoRP;
      if (typeof parsed.turno !== "number" || !Array.isArray(parsed.feed)) return false;
      salvar(parsed);
      set({ estado: parsed });
      return true;
    } catch {
      return false;
    }
  },
}));

/** O estado que a engine acabou de produzir a partir do feed[0]. */
function estadoCom(entrada: EntradaFeed): EstadoRP {
  const est = useRP.getState().estado;
  const d = entrada.delta;
  const clamp = (v: number) => Math.max(0, Math.min(100, v));
  const rel = { ...est.relacoes };
  if (d.relacoes) {
    for (const [k, v] of Object.entries(d.relacoes)) {
      rel[k] = Math.max(-100, Math.min(100, (rel[k] ?? 50) + v));
    }
  }
  return {
    ...est,
    turno: entrada.turno,
    data: entrada.data,
    caixa: Math.max(0, est.caixa + (d.caixa ?? 0)),
    pessoal: Math.max(0, est.pessoal + (d.pessoal ?? 0)),
    coin: Math.max(1, +(est.coin + (d.coin ?? 0)).toFixed(2)),
    holding: Math.max(0, est.holding + (d.holding ?? 0)),
    cartao: Math.max(
      0,
      Math.min(
        LIMITE_CARTAO,
        est.cartao +
          0.05 -
          (entrada.categoria === "gasto" ||
          entrada.categoria === "familia" ||
          entrada.categoria === "caridade"
            ? Math.max(0, -(d.caixa ?? 0))
            : 0),
      ),
    ),
    heat: clamp(est.heat + (d.heat ?? 0)),
    moral: clamp(est.moral + (d.moral ?? 0)),
    aprovacao: clamp(est.aprovacao + (d.aprovacao ?? 0)),
    relacoes: rel,
    pendencias: entrada.efeitos.some((l) => l.startsWith("AVANÇO:"))
      ? avancarPendencias(est, entrada)
      : est.pendencias,
  };
}

function avancarPendencias(est: EstadoRP, entrada: EntradaFeed) {
  const avancos = entrada.efeitos.filter((l) => l.startsWith("AVANÇO:"));
  return est.pendencias.map((p) => {
    const linha = avancos.find((l) => l.includes(`[${p.nome}]`));
    if (!linha || !p.ativa) return p;
    const passo = Math.min(p.passo + 1, p.etapas.length - 1);
    const concluida = p.passo === passo;
    return { ...p, passo, ativa: !(concluida && passo === p.etapas.length - 1) };
  });
}
