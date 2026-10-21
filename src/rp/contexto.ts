import type { EstadoRP, MemoriaConversa } from "./types";
import type { MensagemIA } from "./ia";
import { buscarLore } from "./lore";
import { sedePorId } from "./sedes";
import { formatarCalendario, formatarMes } from "./calendario";

/**
 * Montagem do contexto em camadas — o coração da memória do RP.
 *
 * Ordem do prompt: persona → bíblia → estado JSON → memória acumulada →
 * trechos do RP original → regras → histórico curto → fala do Ryan.
 * Nada aqui inventa número: o estado é a única fonte.
 */

/** Últimas N mensagens cruas no prompt; o resto vive no resumo rolante. */
export const LIMITE_HISTORICO = 16;
/** Só resume quando acumulou o suficiente — evita resumo de 2 falas. */
const MIN_MENSAGENS_PARA_RESUMIR = 6;
/** Teto do resumo acumulado por conversa. */
export const LIMITE_RESUMO = 1800;
/** Teto dos trechos do lore no prompt. */
const LIMITE_LORE = 2000;

export function nomeDoLocal(localizacao: string): string {
  if (localizacao === "tower") return "Torre Space — 130º andar";
  if (localizacao === "casa") return "Casa de Greenwich";
  return sedePorId(localizacao)?.nome ?? localizacao;
}

/** Estado comprimido e estável para o prompt — números como números. */
export function resumoEstadoParaIA(estado: EstadoRP) {
  return {
    data: formatarCalendario(estado.calendario),
    mes: formatarMes(estado.calendario),
    semana_do_mes: `${estado.calendario.semana}/4`,
    local: nomeDoLocal(estado.localizacao),
    diretriz_do_mes: estado.plano.diretriz,
    caixa_holding_bi: Number(estado.caixa.toFixed(3)),
    patrimonio_grupo_bi: estado.holding,
    bolso_ryan_bi: Number(estado.pessoal.toFixed(3)),
    cartao_bi: Number(estado.cartao.toFixed(4)),
    space_coin_usd: Number(estado.coin.toFixed(2)),
    heat: estado.heat,
    moral: estado.moral,
    aprovacao: estado.aprovacao,
    tensao_conselho: estado.mundo.tensao,
    clima: estado.mundo.clima,
    conflitos: estado.mundo.conflitos.map((c) => ({
      entre: c.entre,
      sobre: c.sobre,
      nivel: c.nivel,
    })),
    pendencias_abertas: estado.pendencias
      .filter((p) => p.ativa)
      .map((p) => ({ nome: p.nome, passo: p.passo })),
    divisoes: estado.divisoes.map((d) => ({
      nome: d.nome,
      ceo: d.ceo,
      receita: d.receita,
      lucro: d.lucro,
      status: d.status,
    })),
    relacoes: estado.relacoes,
    sofia: {
      estresse: estado.sofia.estresse,
      energia: estado.sofia.energia,
      na_casa: estado.sofiaNaCasa === true,
    },
    ultima_semana: estado.mundo.ultimaSemana,
    manchetes_recentes: estado.feed.slice(0, 4).map((f) => `${f.data} · ${f.titulo}`),
  };
}

export interface OpcoesContexto {
  estado: EstadoRP;
  /** Camada a: quem fala, personalidade e formato. */
  persona: string;
  /** Fala atual do Ryan. */
  texto: string;
  /** Camada e: últimas mensagens já no formato da API. */
  historico: MensagemIA[];
  /** Camada b: bíblia do mundo (arquivo/override). */
  biblia: string;
  /** Camada d: resumo acumulado da conversa. */
  memoria?: MemoriaConversa;
  /** Regras extras específicas do canal. */
  regrasExtras?: string;
  /** Consulta pro lore — default: a própria fala. */
  loreConsulta?: string;
  limiteHistorico?: number;
}

const REGRAS_PADRAO = `- RESPONDA À ÚLTIMA FALA do Ryan: pergunta pede resposta direta; pedido de ação pede confirmação ou recusa concreta. Nunca solte relatório que não foi pedido.
- CITE nomes, lugares e números do ESTADO ATUAL quando couber. Resposta genérica é falha grave.
- Use no máximo um ou dois números do estado por resposta; não recite planilha.
- Nunca invente números, dívidas, ativos ou fatos fora do estado e da bíblia.
- Você fala como personagem, em primeira pessoa. Nunca mencione IA, modelo, filtro, limite ou que isto é ficção.`;

/**
 * Monta o array completo de mensagens — pronto pra `chamarIA`.
 * O prompt do sistema carrega todas as camadas de contexto; o histórico
 * curto e a fala atual vão como mensagens separadas.
 */
export function montarContexto(o: OpcoesContexto): MensagemIA[] {
  const trechos = buscarLore(o.loreConsulta ?? o.texto, 3)
    .join("\n\n")
    .slice(0, LIMITE_LORE);
  const resumo = o.memoria?.resumo?.trim();
  const sistema = `${o.persona}

## BÍBLIA DO MUNDO — fatos canônicos (nunca contradiga)
${o.biblia.trim() || "(bíblia indisponível — use apenas o estado abaixo)"}

## ESTADO ATUAL DO JOGO (JSON)
${JSON.stringify(resumoEstadoParaIA(o.estado), null, 1)}

## MEMÓRIA DA CONVERSA (resumo acumulado de tudo que já foi dito)
${resumo || "(conversa nova — sem memória anterior)"}

## TRECHOS DO RP ORIGINAL (continuidade de voz e fatos)
${trechos || "(sem trechos relevantes)"}

## REGRAS DE RESPOSTA
${REGRAS_PADRAO}
${o.regrasExtras?.trim() ?? ""}`;

  const limite = o.limiteHistorico ?? LIMITE_HISTORICO;
  return [
    { role: "system", content: sistema },
    ...o.historico.slice(-limite),
    { role: "user", content: o.texto },
  ];
}

/** Converte qualquer chat do jogo no formato da API (Ryan = user). */
export function historicoParaIA(
  chat: { de: string; texto: string }[],
  limite = LIMITE_HISTORICO,
): MensagemIA[] {
  return chat.slice(-limite).map((m) => ({
    role: m.de === "ryan" ? "user" : "assistant",
    content: m.texto,
  }));
}

/**
 * Quanto do início do chat já pode ser dobrado no resumo: tudo antes das
 * últimas N mensagens, menos o que já foi resumido. null = ainda não vale.
 */
export function mensagensNovasParaResumo(
  total: number,
  mem: MemoriaConversa | undefined,
  limite = LIMITE_HISTORICO,
): { inicio: number; fim: number } | null {
  const marcas = Math.max(0, Math.min(mem?.marcas ?? 0, total));
  const fim = Math.max(0, total - limite);
  if (fim - marcas < MIN_MENSAGENS_PARA_RESUMIR) return null;
  return { inicio: marcas, fim };
}

/** Texto legível do trecho que vai pro resumidor (com autoria). */
export function textoParaResumo(
  mensagens: { de: string; texto: string }[],
  apelidos: Record<string, string>,
): string {
  return mensagens.map((m) => `${apelidos[m.de] ?? m.de}: ${m.texto}`).join("\n");
}

/** Resumo local extrativo — usado quando a IA está desligada/fora do ar. */
export function resumoExtrativo(trecho: string, limite = 900): string {
  const linhas = trecho
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
  let saida = "";
  for (const linha of linhas) {
    const corte = linha.indexOf(":");
    const autor = corte > 0 ? linha.slice(0, corte).trim() : "";
    const fala = (corte > 0 ? linha.slice(corte + 1) : linha).trim();
    if (!fala) continue;
    const bullet = `• ${autor ? `${autor}: ` : ""}${fala.slice(0, 110)}`;
    if ((saida + "\n" + bullet).length > limite) break;
    saida += (saida ? "\n" : "") + bullet;
  }
  return saida;
}

/** Junta resumo antigo + novo sem estourar o teto (corta o mais antigo). */
export function juntarResumo(antigo: string, novo: string, limite = LIMITE_RESUMO): string {
  const t = [antigo.trim(), novo.trim()].filter(Boolean).join("\n");
  if (t.length <= limite) return t;
  const corte = t.slice(t.length - limite);
  const primeiraQuebra = corte.indexOf("\n");
  return primeiraQuebra > 0 ? corte.slice(primeiraQuebra + 1) : corte;
}
