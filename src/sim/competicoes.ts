import {
  calcularTabela,
  embaralhar,
  gerarCalendario,
  gerarConfrontos,
  gerarFaseSuica,
  gerarGrupos,
  nomeFasePorTimes,
  vencedoresMataMata,
} from "./engine";
import type { Competicao, Etapa, Regiao, TipoCompeticao, ZonaTabela } from "./types";

export interface DefCompeticao {
  id: string;
  nome: string;
  curto: string;
  regiao: Regiao;
  tipo: TipoCompeticao;
  grupoChave?: string; // chave em BaseDados.grupos (ligas nacionais)
  turnos?: 1 | 2;
  zonas: ZonaTabela[];
  observacao: string;
  implementado: "completo" | "simplificado";
}

const zona = (desde: number, ate: number, rotulo: string, classe: string): ZonaTabela => ({
  desde,
  ate,
  rotulo,
  classe,
});

export const DEFS: DefCompeticao[] = [
  {
    id: "serie-a",
    nome: "Brasileirão Série A",
    curto: "Série A",
    regiao: "brasil",
    tipo: "liga",
    grupoChave: "serie-a",
    turnos: 2,
    zonas: [
      zona(1, 4, "Libertadores (fase de grupos)", "zona-lib"),
      zona(5, 6, "Libertadores (fase preliminar)", "zona-pre"),
      zona(7, 14, "Sul-Americana", "zona-sula"),
      zona(17, 20, "Rebaixamento à Série B", "zona-reb"),
    ],
    observacao:
      "20 clubes, 38 rodadas (ida e volta). 4 rebaixados, 6 vagas na Libertadores (4 diretas + 2 preliminares) e 8 na Sul-Americana.",
    implementado: "completo",
  },
  {
    id: "serie-b",
    nome: "Brasileirão Série B",
    curto: "Série B",
    regiao: "brasil",
    tipo: "liga",
    grupoChave: "serie-b",
    turnos: 2,
    zonas: [
      zona(1, 4, "Acesso à Série A", "zona-lib"),
      zona(17, 20, "Rebaixamento à Série C", "zona-reb"),
    ],
    observacao: "20 clubes, 38 rodadas. Sobem 4, descem 4.",
    implementado: "completo",
  },
  {
    id: "serie-c",
    nome: "Brasileirão Série C",
    curto: "Série C",
    regiao: "brasil",
    tipo: "liga-c",
    grupoChave: "serie-c",
    turnos: 1,
    zonas: [
      zona(1, 8, "Quadrangulares finais", "zona-lib"),
      zona(17, 20, "Rebaixamento à Série D", "zona-reb"),
    ],
    observacao:
      "Fase única em turno único (19 rodadas). Os 8 primeiros vão a dois quadrangulares (ida e volta); os campeões de cada quadrangular sobem. Os 4 últimos da fase única são rebaixados.",
    implementado: "completo",
  },
  {
    id: "copa-do-brasil",
    nome: "Copa do Brasil",
    curto: "Copa do Brasil",
    regiao: "brasil",
    tipo: "mata-mata",
    zonas: [],
    observacao:
      "Versão simplificada: 32 clubes (os 20 da Série A + 12 convidados das Séries B/C), mata-mata em ida e volta, com final em jogo único. O campeão garante vaga na Libertadores.",
    implementado: "simplificado",
  },
  {
    id: "premier-league",
    nome: "Premier League",
    curto: "Premier",
    regiao: "europa",
    tipo: "liga",
    grupoChave: "premier-league",
    turnos: 2,
    zonas: [
      zona(1, 5, "Champions League", "zona-lib"),
      zona(6, 6, "Europa League", "zona-pre"),
      zona(7, 7, "Conference League", "zona-sula"),
      zona(18, 20, "Rebaixamento", "zona-reb"),
    ],
    observacao: "20 clubes, 38 rodadas. 3 rebaixados, 5 vagas na Champions.",
    implementado: "completo",
  },
  {
    id: "la-liga",
    nome: "La Liga",
    curto: "La Liga",
    regiao: "europa",
    tipo: "liga",
    grupoChave: "la-liga",
    turnos: 2,
    zonas: [
      zona(1, 4, "Champions League", "zona-lib"),
      zona(5, 5, "Europa League", "zona-pre"),
      zona(6, 6, "Conference League", "zona-sula"),
      zona(18, 20, "Rebaixamento", "zona-reb"),
    ],
    observacao: "20 clubes, 38 rodadas. 3 rebaixados, 4 vagas na Champions.",
    implementado: "completo",
  },
  {
    id: "serie-a-italia",
    nome: "Serie A (Itália)",
    curto: "Serie A ITA",
    regiao: "europa",
    tipo: "liga",
    grupoChave: "serie-a-italia",
    turnos: 2,
    zonas: [
      zona(1, 4, "Champions League", "zona-lib"),
      zona(5, 6, "Europa League", "zona-pre"),
      zona(7, 7, "Conference League", "zona-sula"),
      zona(18, 20, "Rebaixamento", "zona-reb"),
    ],
    observacao: "20 clubes, 38 rodadas. 3 rebaixados, 4 vagas na Champions.",
    implementado: "completo",
  },
  {
    id: "bundesliga",
    nome: "Bundesliga",
    curto: "Bundesliga",
    regiao: "europa",
    tipo: "liga",
    grupoChave: "bundesliga",
    turnos: 2,
    zonas: [
      zona(1, 4, "Champions League", "zona-lib"),
      zona(5, 6, "Europa League", "zona-pre"),
      zona(7, 7, "Conference League", "zona-sula"),
      zona(17, 18, "Rebaixamento", "zona-reb"),
    ],
    observacao:
      "18 clubes, 34 rodadas. Rebaixamento direto dos 2 últimos (playoff do 16º não simulado).",
    implementado: "simplificado",
  },
  {
    id: "ligue-1",
    nome: "Ligue 1",
    curto: "Ligue 1",
    regiao: "europa",
    tipo: "liga",
    grupoChave: "ligue-1",
    turnos: 2,
    zonas: [
      zona(1, 4, "Champions League", "zona-lib"),
      zona(5, 5, "Europa League", "zona-pre"),
      zona(6, 6, "Conference League", "zona-sula"),
      zona(17, 18, "Rebaixamento", "zona-reb"),
    ],
    observacao:
      "18 clubes, 34 rodadas. Rebaixamento direto dos 2 últimos (playoff do 16º não simulado).",
    implementado: "simplificado",
  },
  {
    id: "champions",
    nome: "UEFA Champions League",
    curto: "Champions",
    regiao: "internacional",
    tipo: "suico",
    zonas: [
      zona(1, 8, "Classificado às oitavas", "zona-lib"),
      zona(9, 24, "Playoff das oitavas", "zona-pre"),
      zona(25, 36, "Eliminado", "zona-reb"),
    ],
    observacao:
      "36 clubes em fase de liga com 8 jogos por clube. Top 8 vai direto às oitavas; 9º a 24º disputam o playoff. Mata-mata em jogo único (simplificação).",
    implementado: "simplificado",
  },
  {
    id: "europa-league",
    nome: "UEFA Europa League",
    curto: "Europa League",
    regiao: "internacional",
    tipo: "suico",
    zonas: [
      zona(1, 8, "Classificado às oitavas", "zona-lib"),
      zona(9, 24, "Playoff das oitavas", "zona-pre"),
      zona(25, 36, "Eliminado", "zona-reb"),
    ],
    observacao:
      "36 clubes em fase de liga com 8 jogos por clube. Mesma estrutura da Champions. Mata-mata em jogo único (simplificação).",
    implementado: "simplificado",
  },
  {
    id: "conference-league",
    nome: "UEFA Conference League",
    curto: "Conference",
    regiao: "internacional",
    tipo: "suico",
    zonas: [
      zona(1, 8, "Classificado às oitavas", "zona-lib"),
      zona(9, 24, "Playoff das oitavas", "zona-pre"),
      zona(25, 36, "Eliminado", "zona-reb"),
    ],
    observacao:
      "36 clubes em fase de liga com 8 jogos por clube. Mesma estrutura da Champions. Mata-mata em jogo único (simplificação).",
    implementado: "simplificado",
  },
  {
    id: "libertadores",
    nome: "CONMEBOL Libertadores",
    curto: "Libertadores",
    regiao: "internacional",
    tipo: "grupos",
    zonas: [
      zona(1, 2, "Classificado às oitavas", "zona-lib"),
      zona(3, 4, "Eliminado", "zona-reb"),
    ],
    observacao:
      "32 clubes em 8 grupos de 4 (ida e volta). Os 2 melhores de cada grupo avançam às oitavas. Mata-mata em jogo único (simplificação).",
    implementado: "simplificado",
  },
  {
    id: "sul-americana",
    nome: "CONMEBOL Sul-Americana",
    curto: "Sul-Americana",
    regiao: "internacional",
    tipo: "grupos",
    zonas: [
      zona(1, 2, "Classificado às oitavas", "zona-lib"),
      zona(3, 4, "Eliminado", "zona-reb"),
    ],
    observacao:
      "32 clubes em 8 grupos de 4 (ida e volta). Os 2 melhores avançam às oitavas. Mata-mata em jogo único (simplificação).",
    implementado: "simplificado",
  },
  {
    id: "mundial",
    nome: "Mundial de Clubes",
    curto: "Mundial",
    regiao: "internacional",
    tipo: "grupos",
    zonas: [
      zona(1, 2, "Classificado às oitavas", "zona-lib"),
      zona(3, 4, "Eliminado", "zona-reb"),
    ],
    observacao:
      "32 clubes em 8 grupos de 4 (turno único). Os 2 melhores avançam ao mata-mata em jogo único (simplificação).",
    implementado: "simplificado",
  },
];

export const getDef = (id: string) => DEFS.find((d) => d.id === id)!;

/* --------------------------- criação de competição ------------------------ */

export function criarCompeticao(
  defId: string,
  temporada: number,
  clubes: string[],
): Competicao {
  const def = getDef(defId);
  const comp: Competicao = {
    id: def.id,
    nome: def.nome,
    regiao: def.regiao,
    tipo: def.tipo,
    temporada,
    clubes,
    etapas: [],
    zonas: def.zonas,
    observacao: def.observacao,
    implementado: def.implementado,
  };

  switch (def.tipo) {
    case "liga":
    case "liga-c":
      comp.etapas.push({
        id: "fase-1",
        nome: def.tipo === "liga-c" ? "Fase única" : "Pontos corridos",
        partidas: gerarCalendario(clubes, def.turnos ?? 2),
        concluida: false,
      });
      break;
    case "mata-mata":
      comp.etapas.push({
        id: "mm-1",
        nome: nomeFasePorTimes(clubes.length),
        partidas: gerarConfrontos(embaralhar(clubes), nomeFasePorTimes(clubes.length), true),
        concluida: false,
      });
      break;
    case "suico":
      comp.etapas.push({
        id: "liga",
        nome: "Fase de liga",
        partidas: gerarFaseSuica(clubes, 8),
        concluida: false,
      });
      break;
    case "grupos": {
      const grupos = gerarGrupos(clubes, 4);
      const turnos: 1 | 2 = def.id === "mundial" ? 1 : 2;
      const partidas = Object.entries(grupos).flatMap(([nome, ids]) =>
        gerarCalendario(ids, turnos, nome),
      );
      comp.etapas.push({
        id: "grupos",
        nome: "Fase de grupos",
        partidas,
        gruposIds: grupos,
        concluida: false,
      });
      break;
    }
  }
  return comp;
}

/* ------------------------------ avanço de fase ---------------------------- */

function etapaConcluida(e: Etapa) {
  return e.partidas.every((p) => p.golsCasa !== null);
}

/** Cria a próxima etapa da competição (ou define o campeão). Muta a competição. */
export function avancarFase(comp: Competicao): void {
  const atual = comp.etapas[comp.etapas.length - 1];
  if (!atual || !etapaConcluida(atual)) return;
  atual.concluida = true;

  const def = getDef(comp.id);

  // Ligas nacionais
  if (def.tipo === "liga") {
    const tabela = calcularTabela(comp.clubes, atual.partidas);
    comp.classificacaoFinal = tabela.map((l) => l.clubeId);
    comp.campeao = tabela[0]?.clubeId;
    return;
  }

  if (def.tipo === "liga-c") {
    if (atual.id === "fase-1") {
      const tabela = calcularTabela(comp.clubes, atual.partidas);
      comp.classificacaoFinal = tabela.map((l) => l.clubeId);
      const top8 = tabela.slice(0, 8).map((l) => l.clubeId);
      const grupos: Record<string, string[]> = {
        "Quadrangular A": [top8[0], top8[3], top8[4], top8[7]],
        "Quadrangular B": [top8[1], top8[2], top8[5], top8[6]],
      };
      comp.etapas.push({
        id: "quadrangulares",
        nome: "Quadrangulares finais",
        gruposIds: grupos,
        partidas: Object.entries(grupos).flatMap(([nome, ids]) =>
          gerarCalendario(ids, 2, nome),
        ),
        concluida: false,
      });
      return;
    }
    if (atual.id === "quadrangulares") {
      const vencedores = Object.entries(atual.gruposIds ?? {}).map(([nome, ids]) => {
        const t = calcularTabela(
          ids,
          atual.partidas.filter((p) => p.fase === nome),
        );
        return t[0].clubeId;
      });
      comp.etapas.push({
        id: "final",
        nome: "Final",
        partidas: gerarConfrontos(vencedores, "Final", false),
        concluida: false,
      });
      return;
    }
    if (atual.id === "final") {
      comp.campeao = vencedoresMataMata(atual)[0];
      return;
    }
  }

  // Fase de liga suíça (Champions / Europa / Conference)
  if (def.tipo === "suico" && atual.id === "liga") {
    const tabela = calcularTabela(comp.clubes, atual.partidas);
    comp.classificacaoFinal = tabela.map((l) => l.clubeId);
    const playoff = tabela.slice(8, 24).map((l) => l.clubeId);
    comp.etapas.push({
      id: "playoff",
      nome: "Playoff das oitavas",
      partidas: gerarConfrontos(
        playoff.slice(0, 8).flatMap((c, i) => [c, playoff[15 - i]]),
        "Playoff das oitavas",
        false,
      ),
      concluida: false,
    });
    return;
  }

  if (def.tipo === "suico" && atual.id === "playoff") {
    const top8 = (comp.classificacaoFinal ?? []).slice(0, 8);
    const vencedores = embaralhar(vencedoresMataMata(atual));
    const chaveados = top8.flatMap((c, i) => [c, vencedores[i]]);
    comp.etapas.push({
      id: "mm-16",
      nome: "Oitavas de final",
      partidas: gerarConfrontos(chaveados, "Oitavas de final", false),
      concluida: false,
    });
    return;
  }

  // Grupos (Libertadores / Sul-Americana / Mundial)
  if (def.tipo === "grupos" && atual.id === "grupos") {
    const primeiros: string[] = [];
    const segundos: string[] = [];
    Object.entries(atual.gruposIds ?? {}).forEach(([nome, ids]) => {
      const t = calcularTabela(
        ids,
        atual.partidas.filter((p) => p.fase === nome),
      );
      primeiros.push(t[0].clubeId);
      segundos.push(t[1].clubeId);
    });
    const segundosEmb = embaralhar(segundos);
    const chaveados = primeiros.flatMap((c, i) => [c, segundosEmb[i]]);
    comp.etapas.push({
      id: "mm-16",
      nome: "Oitavas de final",
      partidas: gerarConfrontos(chaveados, "Oitavas de final", false),
      concluida: false,
    });
    return;
  }

  // Mata-mata genérico
  const vencedores = vencedoresMataMata(atual);
  if (vencedores.length === 1) {
    comp.campeao = vencedores[0];
    return;
  }
  const nomeFase = nomeFasePorTimes(vencedores.length);
  const idaEVolta = def.id === "copa-do-brasil" && vencedores.length > 2;
  comp.etapas.push({
    id: `mm-${vencedores.length}`,
    nome: nomeFase,
    partidas: gerarConfrontos(vencedores, nomeFase, idaEVolta),
    concluida: false,
  });
}

export function competicaoFinalizada(comp: Competicao): boolean {
  if (comp.campeao) return true;
  const def = getDef(comp.id);
  if (def.tipo === "liga") return !!comp.classificacaoFinal;
  return false;
}
