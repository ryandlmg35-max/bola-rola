import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { criarBaseInicial } from "./data/clubes";
import {
  DEFS,
  avancarFase,
  competicaoFinalizada,
  criarCompeticao,
  getDef,
} from "./competicoes";
import {
  calcularTabela,
  notaClube,
  simularPartida,
  uid,
} from "./engine";
import type {
  Clube,
  Competicao,
  Jogador,
  ModoSimulacao,
  Partida,
} from "./types";

export interface EstadoApi {
  fonte: "demo" | "football-data" | "api-football";
  credencialConfigurada: boolean;
  carregando: string | null;
  progresso: number;
  ultimaAtualizacao: string | null;
  mensagem: string | null;
}

interface SimState {
  temporada: number;
  modo: ModoSimulacao;
  clubes: Record<string, Clube>;
  grupos: Record<string, string[]>;
  competicoes: Record<string, Competicao>;
  clubeSelecionado: string | null;
  api: EstadoApi;

  // ações
  resetar: () => void;
  setModo: (m: ModoSimulacao) => void;
  selecionarClube: (id: string) => void;
  garantirCompeticao: (id: string) => void;
  simularRodada: (compId: string) => void;
  simularTurno: (compId: string) => void;
  simularCompeticao: (compId: string) => void;
  simularTudo: () => void;
  avancarTemporada: () => void;
  adicionarJogador: (clubeId: string, j: Omit<Jogador, "id">) => void;
  atualizarJogador: (clubeId: string, j: Jogador) => void;
  removerJogador: (clubeId: string, jogadorId: string) => void;
  atualizarDados: () => Promise<void>;
}

/* ------------------------------ helpers ---------------------------------- */

function estadoInicial() {
  const base = criarBaseInicial();
  const competicoes: Record<string, Competicao> = {};
  for (const def of DEFS) {
    if (def.grupoChave) {
      competicoes[def.id] = criarCompeticao(def.id, 1, base.grupos[def.grupoChave]);
    }
  }
  return {
    temporada: 1,
    clubes: base.clubes,
    grupos: base.grupos,
    competicoes,
    clubeSelecionado: base.grupos["serie-a"][0],
  };
}

function ordenarPorNota(clubes: Record<string, Clube>, ids: string[]) {
  return [...ids].sort((a, b) => notaClube(clubes[b]) - notaClube(clubes[a]));
}

/** Monta participantes de competições internacionais/copas. */
function montarParticipantes(
  id: string,
  clubes: Record<string, Clube>,
  grupos: Record<string, string[]>,
  competicoes: Record<string, Competicao>,
): string[] {
  const classificados = (compId: string, inicio: number, fim: number) => {
    const comp = competicoes[compId];
    const lista =
      comp?.classificacaoFinal ??
      (comp
        ? calcularTabela(comp.clubes, comp.etapas[0]?.partidas ?? []).map((l) => l.clubeId)
        : ordenarPorNota(clubes, grupos[compId] ?? []));
    return lista.slice(inicio, fim);
  };

  switch (id) {
    case "copa-do-brasil": {
      const convidados = ordenarPorNota(clubes, [
        ...(grupos["serie-b"] ?? []),
        ...(grupos["serie-c"] ?? []),
      ]).slice(0, 12);
      return [...(competicoes["serie-a"]?.clubes ?? grupos["serie-a"] ?? []), ...convidados];
    }
    case "champions": {
      const vagas: Array<[string, number]> = [
        ["premier-league", 5],
        ["la-liga", 4],
        ["serie-a-italia", 4],
        ["bundesliga", 4],
        ["ligue-1", 4],
      ];
      const base = vagas.flatMap(([liga, n]) => classificados(liga, 0, n));
      const reservas = ordenarPorNota(
        clubes,
        vagas.flatMap(([liga]) => classificados(liga, 5, 12)),
      );
      return [...base, ...reservas].slice(0, 36);
    }
    case "europa-league": {
      const vagas: Array<[string, number, number]> = [
        ["premier-league", 5, 9],
        ["la-liga", 4, 8],
        ["serie-a-italia", 4, 8],
        ["bundesliga", 4, 8],
        ["ligue-1", 4, 8],
      ];
      const base = vagas.flatMap(([liga, a, b]) => classificados(liga, a, b));
      return base.slice(0, 36);
    }
    case "conference-league": {
      const vagas: Array<[string, number, number]> = [
        ["premier-league", 9, 16],
        ["la-liga", 8, 15],
        ["serie-a-italia", 8, 15],
        ["bundesliga", 8, 15],
        ["ligue-1", 8, 15],
      ];
      return vagas.flatMap(([liga, a, b]) => classificados(liga, a, b)).slice(0, 36);
    }
    case "libertadores": {
      const brasileiros = classificados("serie-a", 0, 8);
      const conmebol = ordenarPorNota(clubes, grupos["conmebol"] ?? []);
      return [...brasileiros, ...conmebol].slice(0, 32);
    }
    case "sul-americana": {
      const brasileiros = classificados("serie-a", 8, 16);
      const conmebol = ordenarPorNota(clubes, grupos["conmebol"] ?? []).slice(8);
      const extras = ordenarPorNota(clubes, grupos["serie-b"] ?? []).slice(0, 8);
      return [...brasileiros, ...conmebol, ...extras].slice(0, 32);
    }
    case "mundial": {
      const europa = [
        ...classificados("premier-league", 0, 3),
        ...classificados("la-liga", 0, 3),
        ...classificados("serie-a-italia", 0, 3),
        ...classificados("bundesliga", 0, 2),
        ...classificados("ligue-1", 0, 2),
      ];
      const sul = [
        ...classificados("serie-a", 0, 4),
        ...ordenarPorNota(clubes, grupos["conmebol"] ?? []).slice(0, 6),
      ];
      const mundo = grupos["mundo"] ?? [];
      const todos = [...europa, ...sul, ...mundo];
      const extras = ordenarPorNota(
        clubes,
        (grupos["premier-league"] ?? []).concat(grupos["la-liga"] ?? []),
      ).filter((c) => !todos.includes(c));
      return [...new Set([...todos, ...extras])].slice(0, 32);
    }
    default:
      return [];
  }
}

function jogarPartida(
  p: Partida,
  clubes: Record<string, Clube>,
  modo: ModoSimulacao,
  permitirPenaltis: boolean,
) {
  const r = simularPartida(notaClube(clubes[p.casa]), notaClube(clubes[p.fora]), modo);
  p.golsCasa = r.golsCasa;
  p.golsFora = r.golsFora;
  p.modo = modo;
  if (permitirPenaltis) {
    p.penaltisCasa = 3 + Math.floor(Math.random() * 3);
    p.penaltisFora = 3 + Math.floor(Math.random() * 3);
    if (p.penaltisCasa === p.penaltisFora) p.penaltisCasa += 1;
  }
}

function proximaRodadaPendente(comp: Competicao) {
  const etapa = comp.etapas[comp.etapas.length - 1];
  if (!etapa) return null;
  const pendentes = etapa.partidas.filter((p) => p.golsCasa === null);
  if (!pendentes.length) return null;
  const rodada = Math.min(...pendentes.map((p) => p.rodada));
  return { etapa, rodada };
}

function simularUmaRodada(comp: Competicao, clubes: Record<string, Clube>, modo: ModoSimulacao) {
  const alvo = proximaRodadaPendente(comp);
  if (!alvo) {
    avancarFase(comp);
    return false;
  }
  const mataMata = comp.etapas[comp.etapas.length - 1].id.startsWith("mm") ||
    comp.etapas[comp.etapas.length - 1].id === "playoff" ||
    comp.etapas[comp.etapas.length - 1].id === "final";
  alvo.etapa.partidas
    .filter((p) => p.rodada === alvo.rodada && p.golsCasa === null)
    .forEach((p) => jogarPartida(p, clubes, modo, mataMata));
  if (alvo.etapa.partidas.every((p) => p.golsCasa !== null)) avancarFase(comp);
  return true;
}

function simularTudoDaCompeticao(
  comp: Competicao,
  clubes: Record<string, Clube>,
  modo: ModoSimulacao,
) {
  let guarda = 0;
  while (!competicaoFinalizada(comp) && guarda < 200) {
    const rodou = simularUmaRodada(comp, clubes, modo);
    if (!rodou && competicaoFinalizada(comp)) break;
    guarda++;
  }
}

/* -------------------------------- store ----------------------------------- */

const armazenamento = createJSONStorage(() => {
  if (typeof window === "undefined") {
    return {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
    };
  }
  return window.localStorage;
});

export const useSim = create<SimState>()(
  persist(
    (set, get) => ({
      ...estadoInicial(),
      modo: "nota" as ModoSimulacao,
      api: {
        fonte: "demo",
        credencialConfigurada: false,
        carregando: null,
        progresso: 0,
        ultimaAtualizacao: null,
        mensagem: null,
      },

      resetar: () =>
        set({
          ...estadoInicial(),
          modo: "nota",
          api: {
            fonte: "demo",
            credencialConfigurada: false,
            carregando: null,
            progresso: 0,
            ultimaAtualizacao: null,
            mensagem: null,
          },
        }),

      setModo: (modo) => set({ modo }),
      selecionarClube: (clubeSelecionado) => set({ clubeSelecionado }),

      garantirCompeticao: (id) => {
        const st = get();
        if (st.competicoes[id]) return;
        const def = getDef(id);
        const clubes = def.grupoChave
          ? st.grupos[def.grupoChave]
          : montarParticipantes(id, st.clubes, st.grupos, st.competicoes);
        if (!clubes.length) return;
        set({
          competicoes: {
            ...st.competicoes,
            [id]: criarCompeticao(id, st.temporada, clubes),
          },
        });
      },

      simularRodada: (compId) => {
        get().garantirCompeticao(compId);
        set((st) => {
          const comp = structuredClone(st.competicoes[compId]);
          if (!comp) return st;
          simularUmaRodada(comp, st.clubes, st.modo);
          return { competicoes: { ...st.competicoes, [compId]: comp } };
        });
      },

      simularTurno: (compId) => {
        get().garantirCompeticao(compId);
        set((st) => {
          const comp = structuredClone(st.competicoes[compId]);
          if (!comp) return st;
          const etapa = comp.etapas[comp.etapas.length - 1];
          const total = Math.max(...etapa.partidas.map((p) => p.rodada));
          const metade = Math.ceil(total / 2);
          let guarda = 0;
          while (guarda < 60) {
            const alvo = proximaRodadaPendente(comp);
            if (!alvo || alvo.rodada > metade) break;
            simularUmaRodada(comp, st.clubes, st.modo);
            guarda++;
          }
          return { competicoes: { ...st.competicoes, [compId]: comp } };
        });
      },

      simularCompeticao: (compId) => {
        get().garantirCompeticao(compId);
        set((st) => {
          const comp = structuredClone(st.competicoes[compId]);
          if (!comp) return st;
          simularTudoDaCompeticao(comp, st.clubes, st.modo);
          return { competicoes: { ...st.competicoes, [compId]: comp } };
        });
      },

      simularTudo: () => {
        const ordem = [
          "serie-a","serie-b","serie-c","premier-league","la-liga","serie-a-italia",
          "bundesliga","ligue-1","copa-do-brasil","champions","europa-league",
          "conference-league","libertadores","sul-americana","mundial",
        ];
        for (const id of ordem) {
          get().garantirCompeticao(id);
          get().simularCompeticao(id);
        }
      },

      avancarTemporada: () =>
        set((st) => {
          const clubes = structuredClone(st.clubes);
          const grupos = { ...st.grupos };
          const temporada = st.temporada + 1;

          // histórico da temporada encerrada
          for (const comp of Object.values(st.competicoes)) {
            const lista = comp.classificacaoFinal ?? [];
            lista.forEach((clubeId, i) => {
              const c = clubes[clubeId];
              if (!c) return;
              c.historico = [
                ...c.historico,
                {
                  temporada: st.temporada,
                  competicao: comp.nome,
                  divisao: comp.nome,
                  posicao: i + 1,
                },
              ].slice(-40);
            });
          }

          // acesso e rebaixamento no Brasil
          const a = st.competicoes["serie-a"]?.classificacaoFinal;
          const b = st.competicoes["serie-b"]?.classificacaoFinal;
          const c = st.competicoes["serie-c"];
          if (a && b && a.length === 20 && b.length === 20) {
            const caemA = a.slice(16);
            const sobemB = b.slice(0, 4);
            const caemB = b.slice(16);
            const campeoesC =
              c?.etapas
                .find((e) => e.id === "quadrangulares")
                ?.gruposIds
                ? Object.entries(
                    c.etapas.find((e) => e.id === "quadrangulares")!.gruposIds!,
                  ).map(([nome, ids]) => {
                    const etapa = c.etapas.find((e) => e.id === "quadrangulares")!;
                    const t = calcularTabela(
                      ids,
                      etapa.partidas.filter((p) => p.fase === nome),
                    );
                    return t[0].clubeId;
                  })
                : [];
            const caemC = c?.classificacaoFinal?.slice(16) ?? [];

            grupos["serie-a"] = [...a.slice(0, 16), ...sobemB];
            grupos["serie-b"] = [
              ...b.slice(4, 16),
              ...caemA,
              ...campeoesC.filter(Boolean),
            ];
            grupos["serie-c"] = [
              ...(c?.classificacaoFinal ?? grupos["serie-c"]).filter(
                (id) => !campeoesC.includes(id) && !caemC.includes(id),
              ),
              ...caemB,
            ];
          }

          // novas competições nacionais
          const competicoes: Record<string, Competicao> = {};
          for (const def of DEFS) {
            if (def.grupoChave) {
              competicoes[def.id] = criarCompeticao(def.id, temporada, grupos[def.grupoChave]);
            }
          }

          return { clubes, grupos, competicoes, temporada };
        }),

      adicionarJogador: (clubeId, j) =>
        set((st) => {
          const clube = { ...st.clubes[clubeId] };
          clube.elenco = [...clube.elenco, { ...j, id: uid("j") }];
          return { clubes: { ...st.clubes, [clubeId]: clube } };
        }),

      atualizarJogador: (clubeId, j) =>
        set((st) => {
          const clube = { ...st.clubes[clubeId] };
          clube.elenco = clube.elenco.map((x) => (x.id === j.id ? j : x));
          return { clubes: { ...st.clubes, [clubeId]: clube } };
        }),

      removerJogador: (clubeId, jogadorId) =>
        set((st) => {
          const clube = { ...st.clubes[clubeId] };
          clube.elenco = clube.elenco.filter((x) => x.id !== jogadorId);
          return { clubes: { ...st.clubes, [clubeId]: clube } };
        }),

      atualizarDados: async () => {
        const { buscarLigas } = await import("./servicoDados");
        const ligas = DEFS.filter((d) => d.grupoChave);
        for (let i = 0; i < ligas.length; i++) {
          set((st) => ({
            api: {
              ...st.api,
              carregando: ligas[i].nome,
              progresso: Math.round((i / ligas.length) * 100),
              mensagem: null,
            },
          }));
          await new Promise((r) => setTimeout(r, 120));
        }
        const resultado = await buscarLigas();
        set((st) => ({
          api: {
            ...st.api,
            carregando: null,
            progresso: 100,
            fonte: resultado.fonte,
            credencialConfigurada: resultado.credencialConfigurada,
            ultimaAtualizacao: new Date().toISOString(),
            mensagem: resultado.mensagem,
          },
        }));
      },
    }),
    {
      name: "simulador-futebol-v1",
      version: 1,
      storage: armazenamento,
    },
  ),
);

export { notaClube, calcularTabela };
