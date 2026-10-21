import type { Calendario } from "./types";

/**
 * Calendário fixo de 4 semanas por mês (28 dias). É um RPG de gestão:
 * a semana é a unidade de decisão e o mês é a unidade de prestação de contas.
 * Datas são calculadas a partir da primeira segunda-feira do mês.
 */

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

const MESES_CURTO = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

export function nomeMes(mes: number): string {
  return MESES[Math.max(0, Math.min(11, mes - 1))];
}

export function nomeMesCurto(mes: number): string {
  return MESES_CURTO[Math.max(0, Math.min(11, mes - 1))];
}

function primeiraSegunda(ano: number, mes: number): number {
  const primeiro = new Date(Date.UTC(ano, mes - 1, 1));
  const dow = primeiro.getUTCDay(); // 0=dom, 1=seg
  return 1 + ((8 - dow) % 7);
}

/** Intervalo de datas da semana (ex.: "11–17 jan 2027"). */
export function intervaloDaSemana(c: Calendario): string {
  const base = Date.UTC(c.ano, c.mes - 1, primeiraSegunda(c.ano, c.mes) + (c.semana - 1) * 7);
  const ini = new Date(base);
  const fim = new Date(base + 6 * 86_400_000);
  const d1 = String(ini.getUTCDate()).padStart(2, "0");
  const d2 = String(fim.getUTCDate()).padStart(2, "0");
  const mesFim = fim.getUTCMonth() + 1;
  const anoFim = fim.getUTCFullYear();
  const sufixoMes =
    mesFim === c.mes ? `${nomeMesCurto(c.mes)} ${c.ano}` : `${nomeMesCurto(mesFim)} ${anoFim}`;
  return `${d1}–${d2} ${sufixoMes}`;
}

/** Linha principal usada no topo: "fev 2027 · semana 2/4 · 08–14 fev". */
export function formatarCalendario(c: Calendario): string {
  return `${nomeMesCurto(c.mes)} ${c.ano} · semana ${c.semana}/4 · ${intervaloDaSemana(c)}`;
}

/** Cabeçalho longo pra reunião de fechamento: "Fevereiro de 2027". */
export function formatarMes(c: Calendario): string {
  return `${nomeMes(c.mes).replace(/^./, (m) => m.toUpperCase())} de ${c.ano}`;
}

/** Avança uma semana. No fim da 4ª semana devolve null — aí é hora de fechar o mês. */
export function proximaSemana(c: Calendario): Calendario | null {
  if (c.semana >= 4) return null;
  return { ...c, semana: c.semana + 1 };
}

export function proximoMes(c: Calendario): Calendario {
  if (c.mes >= 12) return { ano: c.ano + 1, mes: 1, semana: 1 };
  return { ano: c.ano, mes: c.mes + 1, semana: 1 };
}

export function mesFechado(c: Calendario): boolean {
  return c.semana >= 4;
}

/** Rótulo curto pro save: "2027-01". */
export function chaveMes(c: Calendario): string {
  return `${c.ano}-${String(c.mes).padStart(2, "0")}`;
}

export function mesesEntre(a: Calendario, b: Calendario): number {
  return (b.ano - a.ano) * 12 + (b.mes - a.mes);
}
