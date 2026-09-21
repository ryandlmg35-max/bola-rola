import type {
  Clube,
  Etapa,
  LinhaTabela,
  ModoSimulacao,
  Partida,
} from "./types";

/* ---------------------------------- utils --------------------------------- */

export const uid = (prefix = "id") =>
  `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

export function embaralhar<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function poisson(lambda: number): number {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return Math.min(k - 1, 8);
}

/* ------------------------------- nota do clube ----------------------------- */

export function notaClube(clube: Clube): number {
  if (!clube.elenco.length) return clube.notaBase;
  const soma = clube.elenco.reduce((s, j) => s + j.nota, 0);
  return Math.round((soma / clube.elenco.length) * 10) / 10;
}

/* ------------------------------ simulação -------------------------------- */

export interface ResultadoSim {
  golsCasa: number;
  golsFora: number;
}

export function simularPartida(
  notaCasa: number,
  notaFora: number,
  modo: ModoSimulacao,
): ResultadoSim {
  if (modo === "aleatorio") {
    const sorteia = () => {
      const r = Math.random();
      if (r < 0.26) return 0;
      if (r < 0.58) return 1;
      if (r < 0.82) return 2;
      if (r < 0.94) return 3;
      if (r < 0.985) return 4;
      return 5;
    };
    return { golsCasa: sorteia(), golsFora: sorteia() };
  }

  // Modo "Nota de elenco": mandante recebe +3 de bônus.
  const forcaCasa = notaCasa + 3;
  const forcaFora = notaFora;
  const dif = Math.max(-25, Math.min(25, forcaCasa - forcaFora));

  const xgCasa = 1.42 * Math.exp(dif / 22);
  const xgFora = 1.12 * Math.exp(-dif / 22);

  return {
    golsCasa: poisson(Math.max(0.15, Math.min(4.2, xgCasa))),
    golsFora: poisson(Math.max(0.12, Math.min(4.0, xgFora))),
  };
}

/* ------------------------------ calendário -------------------------------- */

/** Round-robin (método do círculo). turnos = 1 (turno único) ou 2 (ida e volta). */
export function gerarCalendario(
  clubesIds: string[],
  turnos: 1 | 2 = 2,
  fase = "Rodada",
): Partida[] {
  const times = embaralhar(clubesIds);
  if (times.length % 2 !== 0) times.push("__BYE__");
  const n = times.length;
  const rodadasPorTurno = n - 1;
  const jogosPorRodada = n / 2;
  const partidas: Partida[] = [];

  const fixo = times[0];
  let rotativo = times.slice(1);

  for (let t = 0; t < turnos; t++) {
    let giro = [...rotativo];
    for (let r = 0; r < rodadasPorTurno; r++) {
      const rodada = t * rodadasPorTurno + r + 1;
      const lista = [fixo, ...giro];
      for (let j = 0; j < jogosPorRodada; j++) {
        const a = lista[j];
        const b = lista[n - 1 - j];
        if (a === "__BYE__" || b === "__BYE__") continue;
        const inverte = (r + j) % 2 === 0 ? t === 1 : t === 0;
        partidas.push({
          id: uid("p"),
          fase,
          rodada,
          casa: inverte ? b : a,
          fora: inverte ? a : b,
          golsCasa: null,
          golsFora: null,
        });
      }
      giro = [giro[giro.length - 1], ...giro.slice(0, -1)];
    }
    rotativo = giro;
  }
  return partidas.sort((a, b) => a.rodada - b.rodada);
}

/** Fase de liga "suíça" simplificada: cada clube joga N partidas contra rivais sorteados. */
export function gerarFaseSuica(clubesIds: string[], jogos = 8): Partida[] {
  const partidas: Partida[] = [];
  const contagem: Record<string, number> = {};
  const feitos = new Set<string>();
  clubesIds.forEach((c) => (contagem[c] = 0));

  for (let rodada = 1; rodada <= jogos; rodada++) {
    const disponiveis = embaralhar(clubesIds.filter((c) => contagem[c] < jogos));
    const usados = new Set<string>();
    for (const a of disponiveis) {
      if (usados.has(a)) continue;
      const b = disponiveis.find(
        (x) =>
          x !== a &&
          !usados.has(x) &&
          !feitos.has([a, x].sort().join("|")) &&
          contagem[x] < jogos,
      );
      if (!b) continue;
      usados.add(a);
      usados.add(b);
      feitos.add([a, b].sort().join("|"));
      contagem[a]++;
      contagem[b]++;
      const casaPrimeiro = Math.random() < 0.5;
      partidas.push({
        id: uid("p"),
        fase: "Fase de liga",
        rodada,
        casa: casaPrimeiro ? a : b,
        fora: casaPrimeiro ? b : a,
        golsCasa: null,
        golsFora: null,
      });
    }
  }
  return partidas;
}

export function gerarGrupos(
  clubesIds: string[],
  tamanho: number,
): Record<string, string[]> {
  const embaralhados = embaralhar(clubesIds);
  const grupos: Record<string, string[]> = {};
  const total = Math.floor(embaralhados.length / tamanho);
  for (let g = 0; g < total; g++) {
    grupos[`Grupo ${String.fromCharCode(65 + g)}`] = embaralhados.slice(
      g * tamanho,
      (g + 1) * tamanho,
    );
  }
  return grupos;
}

/* ------------------------------ classificação ----------------------------- */

export function calcularTabela(
  clubesIds: string[],
  partidas: Partida[],
): LinhaTabela[] {
  const mapa = new Map<string, LinhaTabela>();
  clubesIds.forEach((id) =>
    mapa.set(id, {
      clubeId: id,
      pontos: 0,
      jogos: 0,
      vitorias: 0,
      empates: 0,
      derrotas: 0,
      golsPro: 0,
      golsContra: 0,
      saldo: 0,
    }),
  );

  for (const p of partidas) {
    if (p.golsCasa === null || p.golsFora === null) continue;
    const c = mapa.get(p.casa);
    const f = mapa.get(p.fora);
    if (!c || !f) continue;
    c.jogos++;
    f.jogos++;
    c.golsPro += p.golsCasa;
    c.golsContra += p.golsFora;
    f.golsPro += p.golsFora;
    f.golsContra += p.golsCasa;
    if (p.golsCasa > p.golsFora) {
      c.vitorias++;
      c.pontos += 3;
      f.derrotas++;
    } else if (p.golsCasa < p.golsFora) {
      f.vitorias++;
      f.pontos += 3;
      c.derrotas++;
    } else {
      c.empates++;
      f.empates++;
      c.pontos++;
      f.pontos++;
    }
  }

  return [...mapa.values()]
    .map((l) => ({ ...l, saldo: l.golsPro - l.golsContra }))
    .sort(
      (a, b) =>
        b.pontos - a.pontos ||
        b.vitorias - a.vitorias ||
        b.saldo - a.saldo ||
        b.golsPro - a.golsPro ||
        a.clubeId.localeCompare(b.clubeId),
    );
}

/* ------------------------------- mata-mata -------------------------------- */

export function gerarConfrontos(
  clubesIds: string[],
  fase: string,
  idaEVolta: boolean,
): Partida[] {
  const partidas: Partida[] = [];
  for (let i = 0; i < clubesIds.length; i += 2) {
    const a = clubesIds[i];
    const b = clubesIds[i + 1];
    if (!b) continue;
    partidas.push({
      id: uid("p"),
      fase,
      rodada: 1,
      casa: a,
      fora: b,
      golsCasa: null,
      golsFora: null,
    });
    if (idaEVolta) {
      partidas.push({
        id: uid("p"),
        fase,
        rodada: 2,
        casa: b,
        fora: a,
        golsCasa: null,
        golsFora: null,
      });
    }
  }
  return partidas;
}

/** Vencedores de uma etapa de mata-mata (agrega ida/volta, decide empates nos pênaltis). */
export function vencedoresMataMata(etapa: Etapa): string[] {
  const chaves = new Map<string, Partida[]>();
  for (const p of etapa.partidas) {
    const k = [p.casa, p.fora].sort().join("|");
    chaves.set(k, [...(chaves.get(k) ?? []), p]);
  }
  const out: string[] = [];
  for (const jogos of chaves.values()) {
    const placar: Record<string, number> = {};
    jogos.forEach((p) => {
      placar[p.casa] = (placar[p.casa] ?? 0) + (p.golsCasa ?? 0);
      placar[p.fora] = (placar[p.fora] ?? 0) + (p.golsFora ?? 0);
    });
    const [a, b] = Object.keys(placar);
    if (placar[a] === placar[b]) {
      const ultimo = jogos[jogos.length - 1];
      const penA = ultimo.penaltisCasa ?? 0;
      const penB = ultimo.penaltisFora ?? 0;
      out.push(penA >= penB ? ultimo.casa : ultimo.fora);
    } else {
      out.push(placar[a] > placar[b] ? a : b);
    }
  }
  return out;
}

export const NOMES_FASES = [
  "Final",
  "Semifinal",
  "Quartas de final",
  "Oitavas de final",
  "Terceira fase",
  "Segunda fase",
  "Primeira fase",
];

export function nomeFasePorTimes(qtd: number): string {
  const idx = Math.log2(qtd) - 1;
  return NOMES_FASES[Math.max(0, Math.min(NOMES_FASES.length - 1, idx))];
}
