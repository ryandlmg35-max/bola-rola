import type { Divisao, Efeitos, EntradaFeed, EstadoRP, Mundo, RelatorioMes } from "./types";
import { fmtUSD } from "./engine";
import { rng, sorteia } from "./rng";
import { chaveMes, formatarCalendario, formatarMes, proximoMes, proximaSemana } from "./calendario";

/**
 * Motor do mundo: o RP anda sem o Ryan.
 * Todo turno (semana) o mundo gera 1-2 acontecimentos com consequência real
 * em caixa, holding, coin, moral, heat, aprovação, relações e tensão do conselho.
 * A IA (quando ligada) reescreve/genera os eventos; os números passam por
 * validação e clamp antes de encostar no estado.
 */

export type Faccao =
  | "concorrencia"
  | "governo"
  | "imprensa"
  | "conselho"
  | "mercado"
  | "trabalho"
  | "familia"
  | "oportunidade";

export interface EventoMundo {
  id: string;
  faccao: Faccao;
  titulo: string;
  texto: string;
  efeitos: Efeitos;
  conflito?: { entre: string; sobre: string; nivel: number };
  sofia?: { estresse: number; energia: number };
  fonte: "engine" | "ia";
}

export interface ResumoMensal {
  receitaBase: number;
  lucroBase: number;
  receita: number;
  lucro: number;
  porDivisao: { id: string; nome: string; ceo: string; receita: number; lucro: number }[];
}

export interface Reuniao {
  abertura: string;
  ceos: { nome: string; divisao: string; fala: string }[];
  sofia: string;
  axiom: string;
}

export interface Diretriz {
  id: string;
  titulo: string;
  descricao: string;
  /** multiplicadores aplicados ao mês seguinte */
  receitaMult: number;
  lucroMult: number;
  resumo: string;
}

export const DIRETRIZES: Diretriz[] = [
  {
    id: "expansao",
    titulo: "Expansão de império",
    descricao:
      "Meter 30% do lucro do mês em aquisição, marketing e mercado novo. Receita cresce, caixa encolhe, heat sobe.",
    receitaMult: 1.08,
    lucroMult: 0.98,
    resumo: "crescimento agressivo · receita +8%, lucro -2%",
  },
  {
    id: "caixa",
    titulo: "Máquina de caixa",
    descricao:
      "Congelar contratação, renegociar fornecedor e cortar 15% de custo. Caixa e lucro sobem, moral desce.",
    receitaMult: 0.99,
    lucroMult: 1.12,
    resumo: "eficiência · lucro +12%, moral em risco",
  },
  {
    id: "ia",
    titulo: "Aposta em IA",
    descricao:
      "Redirecionar 20% do lucro pra Space AI e data centers. Holding e coin sobem, heat acompanha, resultado é incerto.",
    receitaMult: 1.04,
    lucroMult: 1.03,
    resumo: "produto · holding +, receita +4%, risco alto",
  },
];

/** "$21,8bi" → 21.8 · "$420mi" → 0.42 · "-$68,5mi" → -0.0685 · "—" → 0 */
export function parseMoeda(texto: string): number {
  const t = texto.trim();
  if (!t || t === "-" || t === "—") return 0;
  if (/sinais/i.test(t)) return 0; // pipeline, não receita realizada
  const m = t.match(/(-?)\s*\$?\s*([\d.,]+)\s*(tri|bi|mi|mil|k)?/i);
  if (!m) return 0;
  const n = parseFloat(m[2].replace(/\./g, "").replace(",", "."));
  if (Number.isNaN(n)) return 0;
  const sinal = m[1] === "-" || t.startsWith("-") ? -1 : 1;
  const un = (m[3] ?? "").toLowerCase();
  let valor = n;
  if (un === "tri") valor = n * 1000;
  else if (un === "bi") valor = n;
  else if (un === "mi") valor = n / 1000;
  else if (un === "mil" || un === "k") valor = n / 1_000_000;
  else valor = n / 1000;
  if (/\/dia/i.test(t)) valor *= 30;
  return +(sinal * valor).toFixed(6);
}

export function resumoMensal(estado: EstadoRP): ResumoMensal {
  const porDivisao = estado.divisoes.map((d) => ({
    id: d.id,
    nome: d.nome,
    ceo: d.ceo,
    receita: parseMoeda(d.receita),
    lucro: parseMoeda(d.lucro),
  }));
  const receitaBase = porDivisao.reduce((s, d) => s + d.receita, 0);
  const lucroBase = porDivisao.reduce((s, d) => s + d.lucro, 0);
  const plano = estado.plano;
  // tensão alta corrói execução: -8% no lucro com conselho rachado, -3% no limite
  const penalidade = estado.mundo.tensao >= 70 ? 0.92 : estado.mundo.tensao >= 45 ? 0.97 : 1;
  return {
    receitaBase,
    lucroBase,
    receita: receitaBase * (plano?.receitaMult ?? 1),
    lucro: lucroBase * (plano?.lucroMult ?? 1) * penalidade,
    porDivisao,
  };
}

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

function aplicarRelacoes(
  atuais: Record<string, number>,
  delta?: Record<string, number>,
): Record<string, number> {
  if (!delta) return atuais;
  const saida = { ...atuais };
  for (const [nome, v] of Object.entries(delta)) {
    saida[nome] = clamp((saida[nome] ?? 50) + v, -100, 100);
  }
  return saida;
}

export function ceosAtivos(estado: EstadoRP): { nome: string; divisao: Divisao }[] {
  const vistos = new Set<string>();
  const saida: { nome: string; divisao: Divisao }[] = [];
  for (const d of estado.divisoes) {
    if (d.ceo === "-" || vistos.has(d.ceo)) continue;
    vistos.add(d.ceo);
    saida.push({ nome: d.ceo, divisao: d });
  }
  return saida;
}

const CONF_EMPRESAS = [
  "Apex",
  "Apple",
  "Disney",
  "Amazon",
  "Sony",
  "Tencent",
  "Saudi PIF",
  "Blackstone",
  "Meta",
  "WBD",
];

/** Tensão sobe com conflito/heat e desce em semana limpa. */
function moverTensao(mundo: Mundo, delta: number): number {
  return clamp(mundo.tensao + delta);
}

function conflitosAtualizados(
  mundo: Mundo,
  novo: { entre: string; sobre: string; nivel: number } | undefined,
  turno: number,
): Mundo["conflitos"] {
  // toda semana os atritos esfriam um pouco
  let lista = mundo.conflitos.map((c) => ({ ...c, nivel: c.nivel - 2 })).filter((c) => c.nivel > 4);
  if (novo) {
    const existente = lista.find((c) => c.entre === novo.entre && c.sobre === novo.sobre);
    if (existente) {
      existente.nivel = clamp(existente.nivel + novo.nivel);
    } else {
      lista.push({
        id: `c-${turno}-${novo.entre.replace(/\s+/g, "-").toLowerCase()}`,
        entre: novo.entre,
        sobre: novo.sobre,
        nivel: clamp(novo.nivel),
        desde: turno,
      });
    }
  }
  if (lista.length > 4) lista = lista.slice(-4);
  return lista;
}

function somaEfeitos(base: Efeitos, extra: Efeitos): Efeitos {
  const saida: Efeitos = { ...base };
  for (const [k, v] of Object.entries(extra) as [keyof Efeitos, unknown][]) {
    if (typeof v === "number") {
      (saida[k] as number | undefined) = ((saida[k] as number | undefined) ?? 0) + v;
    }
  }
  if (extra.relacoes) {
    saida.relacoes = { ...(base.relacoes ?? {}) };
    for (const [nome, v] of Object.entries(extra.relacoes)) {
      saida.relacoes[nome] = (saida.relacoes[nome] ?? 0) + v;
    }
  }
  return saida;
}

function escalaEvento(estado: EstadoRP, e: EventoMundo): EventoMundo {
  // Referência: 0,4% da holding/mês é "material" pra imprensa, não pro caixa.
  const holdingRef = Math.max(10, estado.holding * 0.004);
  const caixaRef = Math.max(0.4, estado.caixa * 0.03);
  const out: EventoMundo = { ...e, efeitos: { ...e.efeitos } };
  if (e.efeitos.holding !== undefined) {
    out.efeitos.holding = clamp(e.efeitos.holding, -holdingRef, holdingRef);
  }
  if (e.efeitos.caixa !== undefined) {
    out.efeitos.caixa = clamp(out.efeitos.caixa!, -caixaRef, caixaRef);
  }
  const coinRef = e.efeitos.coin;
  if (coinRef !== undefined) out.efeitos.coin = clamp(coinRef, -5, 5);
  for (const k of ["heat", "moral", "aprovacao"] as const) {
    if (out.efeitos[k] !== undefined) out.efeitos[k] = clamp(out.efeitos[k]!, -12, 12);
  }
  if (out.efeitos.relacoes) {
    for (const nome of Object.keys(out.efeitos.relacoes)) {
      out.efeitos.relacoes[nome] = clamp(out.efeitos.relacoes[nome], -8, 8);
    }
  }
  if (out.conflito) out.conflito.nivel = clamp(out.conflito.nivel, 5, 40);
  return out;
}

/** Tabela local — usada quando não há chave/IA, e como fallback de qualquer erro. */
export function eventosLocais(estado: EstadoRP): EventoMundo[] {
  const r = rng((estado.seed ^ (estado.turno * 7919)) >>> 0);
  const ceos = ceosAtivos(estado);
  const par = () => {
    if (ceos.length < 2) return ["Sofia Mendes", "Axiom"] as const;
    const a = sorteia(r, ceos);
    const b = sorteia(
      r,
      ceos.filter((c) => c.nome !== a.nome),
    );
    return [a.nome, b.nome] as const;
  };

  const fabricas: (() => EventoMundo)[] = [
    () => ({
      id: "ev-apex",
      faccao: "concorrencia",
      fonte: "engine",
      titulo: "Apex abre fábrica no México",
      texto: `A ${sorteia(r, CONF_EMPRESAS)} anunciou um complexo industrial de $12bi em Monterrey, com isenção fiscal de 15 anos. Camila Duarte mandou um áudio de 40 segundos pro conselho: "eles copiaram o nosso playbook, linha por linha." O mercado tratou a notícia como recado direto à Space Consumer.`,
      efeitos: { holding: -14, coin: -1.2, heat: 2, relacoes: { "Camila Duarte": -3 } },
    }),
    () => ({
      id: "ev-cade",
      faccao: "governo",
      fonte: "engine",
      titulo: "CADE abre inquérito da Paramount",
      texto: `O CADE abriu inquérito formal sobre a integração da Paramount e pediu os contratos de exclusividade da Space Media. A assessoria já separou 14 mil páginas. Daniel Cross cancelou a agenda da semana e subiu pro 130º com o jurídico antes das 8h.`,
      efeitos: { heat: 7, holding: -18, caixa: -0.25, relacoes: { "Daniel Cross": -2 } },
    }),
    () => ({
      id: "ev-imprensa",
      faccao: "imprensa",
      fonte: "engine",
      titulo: "NYT ataca o 130º andar",
      texto: `Uma investigação de seis meses do New York Times detalhou salários, jatos e a estrutura paralela de decisão do 130º andar. O texto não achou crime — achou algo pior pra reputação: um governo privado com organograma.`,
      efeitos: { heat: 8, aprovacao: -4, moral: -2 },
    }),
    () => ({
      id: "ev-forbes",
      faccao: "imprensa",
      fonte: "engine",
      titulo: "Forbes: o imperador de 19 anos",
      texto: `A Forbes fechou capa com "O garoto que comprou o Brasil". A matéria é elogiosa até a página 6 e vira documento histórico na página 7. Space Coin abriu o dia em alta e o nome do Ryan passou o presidente nas buscas.`,
      efeitos: { holding: 8, coin: 2, aprovacao: 3, heat: 1 },
    }),
    () => {
      const [a, b] = par();
      return {
        id: "ev-conflito",
        faccao: "conselho",
        fonte: "engine",
        titulo: `${a} x ${b} no orçamento`,
        texto: `A reunião de segunda virou briga: ${a} pediu prioridade de capital e ${b} respondeu com o próprio P&L impresso. A discussão saiu da pauta e entrou no corredor — dois VPs ouviram, quatro repetiram. O conselho fechou a semana com a mesma verba e uma rachadura nova.`,
        efeitos: {
          moral: -4,
          relacoes: { [a]: -6, [b]: -5 },
        },
        conflito: { entre: a, sobre: "prioridade de capital", nivel: 26 },
      };
    },
    () => ({
      id: "ev-greve",
      faccao: "trabalho",
      fonte: "engine",
      titulo: "Sindicato da Foundries ameaça greve",
      texto: `O sindicato da Foundries aprovou estado de greve por 91% dos votos. A pauta é turno de 12 horas e o adicional da cláusula 14.8. Jeff Williams avisou que uma parada de 48h custa $600mi — e que a imprensa já sabe da assembleia.`,
      efeitos: { caixa: -0.35, moral: -5, heat: 4, relacoes: { "Jeff Williams": -3 } },
    }),
    () => ({
      id: "ev-mercado",
      faccao: "mercado",
      fonte: "engine",
      titulo: "Space Coin corrige 7%",
      texto: `Uma carteira adormecida do tesouro moveu 80 milhões de tokens pra exchange e o mercado leu como venda. A Space Coin corrigiu 7% em 40 minutos, a holding perdeu valor de marca e o time de Helena Voss comprou a queda no escuro.`,
      efeitos: { coin: -4, holding: -12, heat: 1, relacoes: { "Helena Voss": 2 } },
    }),
    () => ({
      id: "ev-pif",
      faccao: "oportunidade",
      fonte: "engine",
      titulo: "PIF quer 2% da Space AI",
      texto: `O fundo soberano saudita ofereceu $40bi por 2% da Space AI — avaliação de $2tri pra uma divisão que ainda não faturou. Elon Musk respondeu "conversem com o Ryan" e foi dormir. A oferta fica na mesa por 30 dias.`,
      efeitos: { holding: 16, coin: 3, heat: 2, relacoes: { "Elon Musk — CTO Priya Nair": 3 } },
    }),
    () => ({
      id: "ev-poach",
      faccao: "concorrencia",
      fonte: "engine",
      titulo: "Apple leva 40 engenheiros da Tech",
      texto: `A Apple abriu um centro em Austin e contratou 40 engenheiros da Space Tech em 72 horas, com bônus de 3x. Priya Anand descobriu pela imprensa. O mercado leu como sinal: o vale voltou a pagar caro por talento — e a Space paga mais.`,
      efeitos: { holding: -15, moral: -3, heat: 2, relacoes: { "Priya Anand": -4 } },
    }),
    () => ({
      id: "ev-familia",
      faccao: "familia",
      fonte: "engine",
      titulo: "Sofia descobre o cartão",
      texto: `Sofia cruzou o extrato do cartão corporativo com a agenda e achou uma despesa de $40mi sem nota fiscal. Ela não falou nada na reunião. Mandou o print pro Ryan às 23h47 com uma única pergunta: "isso é presente ou é erro?"`,
      efeitos: { relacoes: { "Sofia Mendes": -4 } },
      sofia: { estresse: 7, energia: -4 },
    }),
    () => ({
      id: "ev-credito",
      faccao: "governo",
      fonte: "engine",
      titulo: "Banco Central libera linha verde",
      texto: `O Banco Central publicou a linha de crédito verde pra infraestrutura e a Space Estates entrou na lista de pré-aprovados com $8bi. As obras continuam paradas — mas agora paradas com funding.`,
      efeitos: { caixa: 0.45, holding: 9, aprovacao: 1, relacoes: { "Sofia Mendes": 2 } },
    }),
    () => ({
      id: "ev-vazamento",
      faccao: "conselho",
      fonte: "engine",
      titulo: "Ata vaza no grupo dos VPs",
      texto: `A ata da reunião de diretoria vazou num grupo de 300 VPs. Não tem ilegalidade: tem frase. "Se o conselho não decidir, eu decido sozinho" virou print com 8 mil encaminhamentos internos e heat externo.`,
      efeitos: { heat: 5, aprovacao: -2, moral: -3 },
    }),
    () => ({
      id: "ev-coin-alta",
      faccao: "mercado",
      fonte: "engine",
      titulo: "ETF de Space Coin aprovado",
      texto: `A SEC aprovou o ETF de Space Coin da BlackRock. O ativo abriu +12% e o tesouro da Space ganhou $6bi em valor de mercado sem mover um dedo. A conferência de imprensa durou 4 minutos.`,
      efeitos: { coin: 4, holding: 10, aprovacao: 2 },
    }),
  ];

  const qtd = r() < 0.38 ? 2 : 1;
  const escolhidos = new Set<number>();
  const saida: EventoMundo[] = [];
  while (saida.length < qtd) {
    const idx = Math.floor(r() * fabricas.length);
    if (escolhidos.has(idx)) continue;
    escolhidos.add(idx);
    saida.push(escalaEvento(estado, fabricas[idx]()));
  }
  return saida;
}

/**
 * Valida eventos gerados pela IA. O modelo escreve; o motor decide se entra.
 * Qualquer coisa fora do contrato → null (chamador usa eventosLocais).
 */
export function validarEventosIA(bruto: string, estado: EstadoRP): EventoMundo[] | null {
  const ini = bruto.indexOf("{");
  const fim = bruto.lastIndexOf("}");
  if (ini < 0 || fim <= ini) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(bruto.slice(ini, fim + 1));
  } catch {
    return null;
  }
  const lista = (parsed as { eventos?: unknown })?.eventos;
  if (!Array.isArray(lista) || lista.length === 0) return null;

  const faccoes: Faccao[] = [
    "concorrencia",
    "governo",
    "imprensa",
    "conselho",
    "mercado",
    "trabalho",
    "familia",
    "oportunidade",
  ];
  const nomes = new Set(
    ceosAtivos(estado)
      .map((c) => c.nome)
      .concat("Sofia Mendes", "Axiom"),
  );
  const saida: EventoMundo[] = [];

  for (const cru of lista.slice(0, 2)) {
    const e = cru as Record<string, unknown>;
    const titulo = typeof e.titulo === "string" ? e.titulo.trim() : "";
    const texto = typeof e.texto === "string" ? e.texto.trim() : "";
    const faccao =
      typeof e.faccao === "string" && faccoes.includes(e.faccao as Faccao)
        ? (e.faccao as Faccao)
        : "concorrencia";
    if (titulo.length < 3 || texto.length < 30) continue;

    const efeitos: Efeitos = {};
    const ef = (e.efeitos ?? {}) as Record<string, unknown>;
    for (const k of [
      "caixa",
      "pessoal",
      "coin",
      "holding",
      "heat",
      "moral",
      "aprovacao",
    ] as const) {
      if (typeof ef[k] === "number" && Number.isFinite(ef[k])) efeitos[k] = ef[k] as number;
    }
    if (ef.relacoes && typeof ef.relacoes === "object") {
      efeitos.relacoes = {};
      for (const [nome, v] of Object.entries(ef.relacoes as Record<string, unknown>)) {
        if (nomes.has(nome) && typeof v === "number" && Number.isFinite(v)) {
          efeitos.relacoes[nome] = v;
        }
      }
    }

    const sofiaCru = e.sofia as Record<string, unknown> | undefined;
    const sofia =
      sofiaCru && typeof sofiaCru.estresse === "number" && typeof sofiaCru.energia === "number"
        ? { estresse: sofiaCru.estresse, energia: sofiaCru.energia }
        : undefined;

    const conflitoCru = e.conflito as Record<string, unknown> | undefined;
    const conflito =
      conflitoCru &&
      typeof conflitoCru.entre === "string" &&
      nomes.has(conflitoCru.entre) &&
      typeof conflitoCru.sobre === "string" &&
      typeof conflitoCru.nivel === "number"
        ? {
            entre: conflitoCru.entre as string,
            sobre: String(conflitoCru.sobre).slice(0, 60),
            nivel: clamp(conflitoCru.nivel, 8, 40),
          }
        : undefined;

    const temEfeito = Object.keys(efeitos).length > 0 || !!sofia || !!conflito;
    if (!temEfeito) continue;

    saida.push(
      escalaEvento(estado, {
        id: `ia-${estado.turno}-${saida.length}`,
        faccao,
        titulo: titulo.slice(0, 60),
        texto: texto.slice(0, 900),
        efeitos,
        conflito,
        sofia,
        fonte: "ia",
      }),
    );
  }
  return saida.length > 0 ? saida : null;
}

/** Aplica os eventos da semana inteira e devolve o estado novo + linhas pro feed. */
export function aplicarEventos(
  estado: EstadoRP,
  eventos: EventoMundo[],
): { estado: EstadoRP; linhas: string[]; delta: Efeitos } {
  let delta: Efeitos = {};
  let tensaoExtra = 0;
  let conflito: { entre: string; sobre: string; nivel: number } | undefined;
  const sofia = { ...estado.sofia };

  for (const e of eventos) {
    delta = somaEfeitos(delta, e.efeitos);
    if (e.conflito) {
      conflito = e.conflito;
      tensaoExtra += e.conflito.nivel / 3;
    }
    if ((e.efeitos.heat ?? 0) >= 5) tensaoExtra += 2;
    if (e.faccao === "familia") tensaoExtra += 1;
    if (e.faccao === "concorrencia" || e.faccao === "mercado") tensaoExtra += 1;
    if (e.faccao === "oportunidade" || e.faccao === "governo") tensaoExtra -= 1;
    if (e.sofia) {
      sofia.estresse = clamp(sofia.estresse + e.sofia.estresse);
      sofia.energia = clamp(sofia.energia + e.sofia.energia);
    }
  }

  const antes = {
    caixa: estado.caixa,
    holding: estado.holding,
    coin: estado.coin,
    heat: estado.heat,
    moral: estado.moral,
    aprovacao: estado.aprovacao,
  };

  const turno = estado.turno + 1;
  const mundo: Mundo = {
    ...estado.mundo,
    tensao: moverTensao(estado.mundo, tensaoExtra - 1),
    conflitos: conflitosAtualizados(estado.mundo, conflito, turno),
    clima:
      estado.mundo.tensao >= 70
        ? "conselho rachado"
        : estado.mundo.tensao >= 45
          ? "tensão de fundo"
          : "semana controlada",
    ultimaSemana: eventos.map((e) => `[${e.faccao}] ${e.titulo}`),
  };

  const novo: EstadoRP = {
    ...estado,
    turno,
    calendario: proximaSemana(estado.calendario) ?? estado.calendario,
    caixa: Math.max(0, +(estado.caixa + (delta.caixa ?? 0)).toFixed(4)),
    pessoal: Math.max(0, +(estado.pessoal + (delta.pessoal ?? 0)).toFixed(4)),
    coin: Math.max(1, +(estado.coin + (delta.coin ?? 0)).toFixed(2)),
    holding: Math.max(0, +(estado.holding + (delta.holding ?? 0)).toFixed(2)),
    heat: clamp(estado.heat + (delta.heat ?? 0)),
    moral: clamp(estado.moral + (delta.moral ?? 0)),
    aprovacao: clamp(estado.aprovacao + (delta.aprovacao ?? 0)),
    relacoes: aplicarRelacoes(estado.relacoes, delta.relacoes),
    sofia,
    mundo,
  };
  novo.data = formatarCalendario(novo.calendario);

  const linhas: string[] = [];
  const seta = (label: string, de: number, para: number, fmt: (v: number) => string) => {
    if (Math.abs(para - de) < 0.0001) return;
    linhas.push(`${label}: ${fmt(de)} → ${fmt(para)} (${para > de ? "+" : ""}${fmt(para - de)})`);
  };
  const stat = (label: string, de: number, para: number) => {
    if (para === de) return;
    linhas.push(`${label}: ${de}/100 → ${para}/100 (${para > de ? "+" : ""}${para - de})`);
  };
  const fmtCoin = (v: number) => `${v < 0 ? "-" : ""}$${Math.abs(v).toFixed(2).replace(".", ",")}`;
  seta("Caixa da holding", antes.caixa, novo.caixa, fmtUSD);
  seta("Patrimônio", antes.holding, novo.holding, fmtUSD);
  seta("Space Coin", antes.coin, novo.coin, fmtCoin);
  stat("Moral", antes.moral, novo.moral);
  stat("Heat", antes.heat, novo.heat);
  stat("Aprovação", antes.aprovacao, novo.aprovacao);
  if (delta.relacoes) {
    for (const [nome, v] of Object.entries(delta.relacoes)) {
      linhas.push(`Relação com ${nome}: ${(novo.relacoes[nome] ?? 50).toFixed(0)}/100`);
    }
  }
  if (conflito) {
    linhas.push(
      `CONFLITO: ${conflito.entre} × ${conflito.sobre} — tensão ${clamp(novo.mundo.tensao)}/100`,
    );
  }
  for (const e of eventos) linhas.push(`EVENTO: ${e.titulo}`);
  if (linhas.length === 0) linhas.push("Semana sem mudança material — o mundo respirou.");
  return { estado: novo, linhas, delta };
}

const REACOES_AUTO = {
  midia: [
    "A imprensa cobriu o conselho como se fosse eleição.",
    "A coluna do meio hoje só fala do 130º andar.",
    "O release saiu antes da reunião acabar.",
  ],
  mercado: [
    "O mercado abriu estável e fechou com o nome da Space na boca.",
    "Analistas ajustaram o modelo sem mudar a tese.",
    "O volume da Space Coin disse o que o comunicado não disse.",
  ],
  povo: [
    "O povo só perguntou uma coisa: isso muda o preço do Apex?",
    "Nas redes, o assunto virou meme antes de virar notícia.",
    "'Bom dia, Ryan' voltou pro trending por associação.",
  ],
};

/** Semana sem ação do jogador: o mundo anda sozinho. */
export function avancarSemanaComEventos(
  estado: EstadoRP,
  eventos: EventoMundo[],
): {
  estado: EstadoRP;
  entrada: EntradaFeed;
} | null {
  const calendario = proximaSemana(estado.calendario);
  if (!calendario) return null; // mês fechou: hora do conselho

  const { estado: novo, linhas, delta } = aplicarEventos(estado, eventos);
  novo.calendario = calendario;
  novo.data = formatarCalendario(calendario);

  const r = rng((estado.seed + estado.turno * 104729) >>> 0);
  const titulo = eventos[0]?.titulo ?? "Engrenagem rodando";
  const cena = `${eventos.map((e) => e.texto).join("\n\n")}\n\nO 130º andar fechou a semana em ${fmtUSD(novo.caixa)} de caixa. ${novo.mundo.clima.replace(/^./, (m) => m.toUpperCase())}.`;

  const entrada: EntradaFeed = {
    id: `semana-${novo.turno}-${novo.seed}`,
    turno: novo.turno,
    data: novo.data,
    categoria: "acaoLivre",
    titulo,
    cena,
    efeitos: linhas,
    delta,
    reacoes: {
      midia: sorteia(r, REACOES_AUTO.midia),
      mercado: sorteia(r, REACOES_AUTO.mercado),
      povo: sorteia(r, REACOES_AUTO.povo),
    },
    escolhas: [
      { rotulo: "Convocar reunião de emergência", categoria: "acaoLivre" },
      { rotulo: "Autorizar aporte de capital", categoria: "investimento" },
      { rotulo: "Ligar pro Axiom agora", categoria: "acaoLivre" },
    ],
    narradoPor: eventos.some((e) => e.fonte === "ia") ? "ia" : "engine",
  };
  novo.feed = [entrada, ...novo.feed].slice(0, 200);
  novo.seed = (estado.seed + novo.turno * 2654435761) >>> 0;
  return { estado: novo, entrada };
}

export function avancarSemanaLocal(estado: EstadoRP): {
  estado: EstadoRP;
  entrada: EntradaFeed;
} | null {
  return avancarSemanaComEventos(estado, eventosLocais(estado));
}

/** Relatório local do conselho — usado sem IA e como fallback. */
export function reuniaoLocal(estado: EstadoRP): Reuniao {
  const resumo = resumoMensal(estado);
  const r = rng((estado.seed + estado.turno * 3301) >>> 0);
  const ceos = ceosAtivos(estado).map(({ nome, divisao }) => {
    const receita = parseMoeda(divisao.receita);
    const lucro = parseMoeda(divisao.lucro);
    const situacao =
      divisao.status === "prejuizo"
        ? "no vermelho"
        : divisao.status === "congelada" || divisao.status === "geladeira"
          ? "parada"
          : divisao.status === "crescendo"
            ? "crescendo acima do plano"
            : "estável";
    const pedido =
      divisao.status === "prejuizo"
        ? "peço mais um trimestre de cobertura e corte de 20% no time"
        : receita > 2
          ? "peço prioridade de capital: cada $1bi aqui vira $1,6bi em 18 meses"
          : "peço autonomia pra fechar contrato sem subir pro 130º";
    return {
      nome,
      divisao: divisao.nome,
      fala: `${divisao.nome} fechou o mês ${situacao}: ${divisao.receita} de receita e ${divisao.lucro} de lucro. ${pedido}.`,
    };
  });

  const expansao = sorteia(r, [
    "Vamos crescer. De novo.",
    "Quem não expande, encolhe.",
    "O próximo trimestre é nosso.",
  ]);

  return {
    abertura: `Bom dia. ${formatarMes(estado.calendario)} fecha com ${fmtUSD(resumo.receita)} de receita, ${fmtUSD(resumo.lucro)} de lucro e ${fmtUSD(estado.caixa)} em caixa. Conselho em ${estado.mundo.tensao}/100 de tensão — ${estado.mundo.clima}. ${expansao} Cada CEO reporta e pede. Eu decido depois.`,
    ceos,
    sofia: `Auditoria fechou: ${fmtUSD(resumo.lucro)} de lucro entrou, ${fmtUSD(resumo.lucro * 0.25)} saiu como dividendo pro Ryan. A tensão do conselho está em ${estado.mundo.tensao}/100. Eu não vou assinar aumento de custo em mês de ${resumo.lucro >= resumo.lucroBase ? "meta batida" : "meta perdida"}.`,
    axiom: `Boss man, o número tá na mesa. ${estado.mundo.conflitos.length > 0 ? `Tem ${estado.mundo.conflitos.length} conflito aberto e eu já sei de quem é a culpa.` : "Conselho limpo, mas eu não confio em conselho limpo."} Escolhe a diretriz e eu executo antes do café esfriar.`,
  };
}

/** Recado espontâneo local — o mundo andou e alguém puxa o Ryan no chat. */
export function recadoLocal(estado: EstadoRP, agente: "sofia" | "axiom"): string {
  const evento = estado.feed[0]?.titulo ?? estado.mundo.ultimaSemana[0] ?? "a semana andou";
  const r = rng((estado.seed ^ (estado.turno * 40503)) >>> 0);
  if (agente === "sofia") {
    return sorteia(r, [
      `Ryan, "${evento}" chegou na minha mesa antes de chegar na imprensa. Caixa em ${fmtUSD(estado.caixa)}. Não aprovo nada novo até eu terminar a auditoria de sexta.`,
      `A semana fechou com ${fmtUSD(estado.caixa)} em caixa e tensão de conselho em ${estado.mundo.tensao}/100. "${evento}" vai custar caro se ninguém responder. Eu respondo, mas você assina.`,
      `Vi o que aconteceu com "${evento}". ${fraseDoEstado(estado)} Se for gastar pra resolver, gasta com nota fiscal.`,
    ]);
  }
  return sorteia(r, [
    `Boss man, "${evento}" não foi acidente. Caixa em ${fmtUSD(estado.caixa)}, tensão em ${estado.mundo.tensao}/100. Eu já tô com dois nomes na cabeça e uma ligação pronta. Só falta você dizer vai.`,
    `Enquanto você dormia, o mundo andou: "${evento}". Nada que não se resolva com dinheiro, tempo ou uma demissão bem escolhida.`,
    `Tô de olho. Depois de "${evento}", o conselho ficou quieto demais. Quieto demais pra mim. Se não me chamarem, eu apareço.`,
  ]);
}

function fraseDoEstado(estado: EstadoRP): string {
  return `Moral em ${estado.moral}/100, heat em ${estado.heat}/100, ${estado.pendencias.filter((p) => p.ativa).length} pendências abertas.`;
}

export function validarReuniaoIA(bruto: string, estado: EstadoRP): Reuniao | null {
  const ini = bruto.indexOf("{");
  const fim = bruto.lastIndexOf("}");
  if (ini < 0 || fim <= ini) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(bruto.slice(ini, fim + 1));
  } catch {
    return null;
  }
  const base = reuniaoLocal(estado);
  const obj = parsed as {
    abertura?: unknown;
    ceos?: unknown;
    sofia?: unknown;
    axiom?: unknown;
  };
  const abertura = typeof obj.abertura === "string" ? obj.abertura.trim().slice(0, 700) : "";
  const sofia = typeof obj.sofia === "string" ? obj.sofia.trim().slice(0, 500) : "";
  const axiom = typeof obj.axiom === "string" ? obj.axiom.trim().slice(0, 500) : "";
  if (!abertura || !sofia || !axiom) return null;

  let ceos = base.ceos;
  if (Array.isArray(obj.ceos)) {
    const validos = new Map(base.ceos.map((c) => [c.nome, c]));
    const recebidos: { nome: string; divisao: string; fala: string }[] = [];
    for (const cru of obj.ceos) {
      const c = cru as Record<string, unknown>;
      if (typeof c.nome !== "string" || typeof c.fala !== "string") continue;
      const real = validos.get(c.nome);
      if (!real) continue;
      recebidos.push({ nome: real.nome, divisao: real.divisao, fala: c.fala.trim().slice(0, 420) });
    }
    if (recebidos.length >= Math.min(5, base.ceos.length)) {
      ceos = base.ceos.map((c) => recebidos.find((r) => r.nome === c.nome) ?? c);
    }
  }
  return { abertura, ceos, sofia, axiom };
}

/** Aplica o fechamento: lucro do mês, dividendo, diretriz e vira o mês. */
export function fecharMesLocal(
  estado: EstadoRP,
  diretrizId: string,
  abertura?: string,
): { estado: EstadoRP; entrada: EntradaFeed; relatorio: RelatorioMes } {
  const diretriz = DIRETRIZES.find((d) => d.id === diretrizId) ?? DIRETRIZES[1];
  const resumo = resumoMensal(estado);
  const caixaAntes = estado.caixa;
  const dividendos = resumo.lucro * 0.25;
  let caixa = estado.caixa + resumo.lucro;
  let holding = estado.holding;
  let moral = estado.moral;
  let heat = estado.heat;
  let tensao = estado.mundo.tensao;

  switch (diretriz.id) {
    case "expansao":
      caixa -= resumo.lucro * 0.3;
      holding += resumo.lucro * 0.5;
      heat += 4;
      moral += 2;
      tensao -= 3;
      break;
    case "caixa":
      caixa += resumo.lucro * 0.12;
      moral -= 4;
      heat -= 1;
      tensao += 2;
      break;
    case "ia":
      caixa -= resumo.lucro * 0.2;
      holding += resumo.lucro * 0.8;
      heat += 2;
      tensao += 1;
      break;
  }

  const calendario = proximoMes(estado.calendario);
  const relatorio: RelatorioMes = {
    ano: estado.calendario.ano,
    mes: estado.calendario.mes,
    receita: resumo.receita,
    lucro: resumo.lucro,
    caixaAntes,
    caixaDepois: Math.max(0, caixa),
    dividendos,
    diretriz: diretriz.titulo,
  };

  const delta: Efeitos = {
    caixa: +(Math.max(0, caixa) - caixaAntes).toFixed(4),
    pessoal: +dividendos.toFixed(4),
    holding: +(holding - estado.holding).toFixed(2),
    heat: heat - estado.heat,
    moral: moral - estado.moral,
  };

  const novo: EstadoRP = {
    ...estado,
    turno: estado.turno + 1,
    calendario,
    data: formatarCalendario(calendario),
    caixa: Math.max(0, +caixa.toFixed(4)),
    pessoal: +(estado.pessoal + dividendos).toFixed(4),
    holding: Math.max(0, +holding.toFixed(2)),
    heat: clamp(heat),
    moral: clamp(moral),
    mundo: {
      ...estado.mundo,
      tensao: clamp(tensao),
      clima: "mês novo, mesma faca",
      ultimaSemana: [`Fechamento de ${formatarMes(estado.calendario)}`],
    },
    plano: {
      diretriz: diretriz.titulo,
      receitaMult: diretriz.receitaMult,
      lucroMult: diretriz.lucroMult,
      mesRef: chaveMes(calendario),
    },
    ultimoRelatorio: relatorio,
    sofia: {
      estresse: clamp(estado.sofia.estresse + (diretriz.id === "expansao" ? 5 : 1)),
      energia: clamp(estado.sofia.energia - (diretriz.id === "caixa" ? 4 : 1)),
    },
  };

  const linhas: string[] = [
    `Receita do mês: ${fmtUSD(resumo.receita)}`,
    `Lucro do mês: ${fmtUSD(resumo.lucro)}`,
    `Caixa: ${fmtUSD(caixaAntes)} → ${fmtUSD(novo.caixa)}`,
    `Dividendo pago ao Ryan: ${fmtUSD(dividendos)}`,
    `Diretriz aprovada: ${diretriz.titulo} (${diretriz.resumo})`,
  ];
  const entrada: EntradaFeed = {
    id: `mes-${estado.calendario.ano}-${estado.calendario.mes}`,
    turno: novo.turno,
    data: novo.data,
    categoria: "acaoLivre",
    titulo: `Conselho de fechamento · ${formatarMes(estado.calendario)}`,
    cena: `${abertura ?? reuniaoLocal(estado).abertura}\n\nO conselho aprovou: ${diretriz.titulo}. ${diretriz.descricao}`,
    efeitos: linhas,
    delta,
    reacoes: {
      midia: "A imprensa tratou o fechamento como resultado de eleição.",
      mercado: "O mercado leu a diretriz e reposicionou o setor inteiro.",
      povo: "O povo só quer saber se o Apex vai ficar mais barato.",
    },
    escolhas: [],
    narradoPor: "engine",
  };
  novo.feed = [entrada, ...novo.feed].slice(0, 200);
  return { estado: novo, entrada, relatorio };
}
