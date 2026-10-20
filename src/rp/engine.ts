import type { Categoria, Efeitos, EntradaFeed, Escolha, EstadoRP, Pendencia } from "./types";
import { faixa, rng, sorteia } from "./rng";

/** Interpreta o texto do jogador: categoria + valor em bilhões USD. */
export function interpretar(texto: string): { categoria: Categoria; valor: number } {
  const t = texto.toLowerCase();

  const valor = extrairValor(t) ?? padraoPorCategoria(matchCategoria(t));
  return { categoria: matchCategoria(t), valor };
}

function matchCategoria(t: string): Categoria {
  const regras: [Categoria, RegExp][] = [
    [
      "esports",
      /\b(index|t1|jdg|faker|lck|lpl|cblol|worlds|msi|ewc|draft|elenco|adc|mid|jungle|top|support|campeonato|série|serie|kkooma|tarzan|kyouma|hope|kael)\b/,
    ],
    [
      "politica",
      /\b(ministro|senado|congresso|pec|presidente|governo|governador|deputado|lei|decreto|impeachment|planalto|alvorada|tpm|cade|anatel|banco central|fazenda)\b/,
    ],
    [
      "familia",
      /\b(sofia|noah|chloé|chloe|família|familia|júlia|julia|isabella|dona lúcia|dona lucia|seu jorge|casamento|filho|filha|bebê|bebe|ceia|jantar em família|aniversário|aniversario)\b/,
    ],
    [
      "ataque",
      /\b(atacar|destruir|derrubar|acabar com|guerra|boicot|processar|humilhar|vingança|vinganca|eliminar|sabotar|foder o|tirar do mercado)\b/,
    ],
    [
      "caridade",
      /\b(caridade|doar|doação|doacao|ajudar os pobres|help|philanthropy|onsocial|campanha de|famílias|familias pobres)\b/,
    ],
    [
      "seguranca",
      /\b(segurança|seguranca|segurar|escolta|guarda|jamm|muralha|paparazzi|câmera|camera|proteção|protecao|gign|mossad|blindar)\b/,
    ],
    [
      "midia",
      /\b(mídia|midia|entrevista|propaganda|anúncio|anuncio|commercial|comercial|sbt|globo|post|twitter|trending|patrocínio|patrocinio|brand)\b/,
    ],
    [
      "contratacao",
      /\b(contratar|contrato|salário|salario|hire|funcionário|funcionario|ceo|staff|treinador|coach|advogado|gerente|bônus|bonus)\b/,
    ],
    [
      "investimento",
      /\b(investir|investimento|comprar|compra|fábrica|fabrica|aquisição|aquisicao|mergulhar|apostar em|franquia|ações|acoes|startup|ia\b|space coin|tokens)\b/,
    ],
    [
      "gasto",
      /\b(gastar|gasto|despesa|queimar|pagar|liberar o|abrir a carteira|torrar|festa|viagem|jantar caro|presente)\b/,
    ],
    ["caridade", /\b(renascer|space basic|moradia|favela)\b/],
  ];
  for (const [cat, re] of regras) if (re.test(t)) return cat;
  return "acaoLivre";
}

/** "500 milhões", "2 bi", "1.5 tri", "R$ 300mi" → bilhões USD. */
function extrairValor(t: string): number | null {
  const m = t.match(
    /(?:r\$|\$)?\s*(\d+(?:[.,]\d+)?)\s*(tri(?:lh)?|bilh|bi\b|milh|mi\b|mil\b|k\b|b\b)?/,
  );
  if (!m) return null;
  const n = parseFloat(m[1].replace(",", "."));
  if (Number.isNaN(n)) return null;
  const un = m[2] ?? "";
  if (/^tri/.test(un)) return n * 1000;
  if (/^bilh|^bi$|^b$/.test(un)) return n;
  if (/^milh|^mi$/.test(un)) return n / 1000;
  if (/^mil$|^k$/.test(un)) return n / 1_000_000;
  // número solto sem unidade: contexto manda — 500 sozinho não é $500bi
  return n > 1000 ? n / 1000 : n / 1000;
}

function padraoPorCategoria(c: Categoria): number {
  switch (c) {
    case "gasto":
      return 0.2;
    case "investimento":
      return 2.0;
    case "contratacao":
      return 0.05;
    case "politica":
      return 0.5;
    case "familia":
      return 0.1;
    case "ataque":
      return 0.4;
    case "midia":
      return 0.1;
    case "esports":
      return 0.5;
    case "seguranca":
      return 0.3;
    case "caridade":
      return 0.5;
    default:
      return 0.3;
  }
}

export const LIMITE_CARTAO = 0.5; // $500mi/mês (relatório de abertura de mês do RP)

export function fmtUSD(bi: number): string {
  const abs = Math.abs(bi);
  const s = (v: number) => v.toFixed(abs >= 10 ? 1 : 2).replace(".", ",");
  if (abs >= 1000) return `$${(abs / 1000).toFixed(2).replace(".", ",")}tri`;
  if (abs >= 1) return `${bi < 0 ? "-" : ""}$${s(abs)}bi`;
  const m = abs * 1000;
  const ms = Number.isInteger(m) ? String(m) : m.toFixed(1).replace(".", ",");
  return `${bi < 0 ? "-" : ""}$${ms}M`;
}

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v));
}

/** Plano de efeitos por categoria — valores base, variados pelo RNG do turno. */
function planear(cat: Categoria, valor: number, r: () => number): Efeitos {
  const jitter = (p: number) => faixa(r, p * 0.8, p * 1.25);
  switch (cat) {
    case "gasto":
      return { caixa: -valor, moral: +2, heat: +3, coin: -Math.min(1, valor * 0.1) };
    case "investimento":
      return { caixa: -valor, holding: +valor * jitter(1.6), coin: +jitter(1.2), heat: +2 };
    case "contratacao":
      return { caixa: -valor, moral: +4, aprovacao: +1 };
    case "politica":
      return { caixa: -valor * 0.6, heat: +6, aprovacao: +jitter(4), holding: +valor * 0.5 };
    case "familia":
      return { caixa: -valor, moral: +5, aprovacao: +2, relacoes: { "Sofia Mendes": +3 } };
    case "ataque":
      return { caixa: -valor * 0.6, heat: +8, aprovacao: -4, coin: +jitter(0.8) };
    case "midia":
      return { caixa: -valor, heat: -6, aprovacao: +3 };
    case "esports":
      return { caixa: -valor, moral: +6, relacoes: { INDEX: +6 }, heat: +2 };
    case "seguranca":
      return { caixa: -valor, heat: -7, moral: +2 };
    case "caridade":
      return { caixa: -valor, aprovacao: +9, heat: -3, holding: +valor * 0.5, moral: +3 };
    default:
      return { caixa: -valor, moral: +2, heat: +1, aprovacao: +1 };
  }
}

/** Eventos ambientais (30% de chance por turno) — consequência vinda de fora. */
function eventoAmbiental(
  r: () => number,
  st: EstadoRP,
): { efeitos: Efeitos; linha: string } | null {
  if (r() > 0.3) return null;
  const tabela = [
    {
      e: { coin: +2, caixa: +0.5 },
      l: "IShowSpeed posta um 'SIUUU' com a camisa da Space — Space Coin sobe $2 e o tesouro embolsa $500M no ralo de liquidez.",
    },
    {
      e: { heat: +5, aprovacao: -2 },
      l: "The Verge vaza um e-mail interno. É a cláusula 14.8 de novo — jornalista do Fediverse ressuscita o 'Coup do Garoto'.",
    },
    {
      e: { moral: +4, caixa: -0.3 },
      l: "Vestiário descobre que o Axiom instalou um simulador de draft no 129º andar. KKooma não sai dele há 14 horas.",
    },
    {
      e: { holding: +30, heat: -2 },
      l: "Analista do Goldman rebaixa... pra comprar. Relatório: 'Space é equity country com dividend yield de império'. Holding +$30bi.",
    },
    {
      e: { aprovacao: +3, moral: +2 },
      l: "O reality 'A Ascensão' estreia em 3º lugar de audiência. Mano a Mano entrevista uma família que saiu da favela por causa do Space Basic.",
    },
    {
      e: { heat: -4, moral: +3 },
      l: "Bob Iger cancela as férias e vai pra Ilha MR pagando $50mil/dia. O inimigo virou cliente de novo — e postou a foto no Instagram.",
    },
  ];
  const ev = sorteia(r, tabela);
  return { efeitos: ev.e, linha: ev.l };
}

const REACOES: Record<Categoria, { m: string[]; k: string[]; p: string[] }> = {
  gasto: {
    m: [
      "FT: 'O garoto torra de novo' — analista do Credit Suisse pede auditoria do caixa.",
      "Bloomberg nota a saída e pergunta se a Space virou 'bazar filantrópico'.",
    ],
    k: [
      "Ações caem 2% no rumble, mas voltam no after quando o caixa é confirmado.",
      "Mercado calcula o burn rate e conclui: 'ele tem pra queimar por 400 anos'.",
    ],
    p: [
      "Trending: '#RyanGastou' — e é elogio.",
      "Povo vê o luxo e sente o embate: 60% aprova, 40% xinga no X.",
    ],
  },
  investimento: {
    m: [
      "NYT abre editorial: 'O que o garoto comprou hoje'.",
      "Reuters: manchete única — 'Space expande, mercado tremer'.",
    ],
    k: [
      "Investidores correm atrás do estojo de ações da Space Coin.",
      "Fundo soberano do Golfo pede meeting com Helena Voss até sexta.",
    ],
    p: [
      "Povo repete o bordão do Axiom: 'boss man'.",
      "'Bom dia, Ryan' volta pro trending junto com o nome do ativo novo.",
    ],
  },
  contratacao: {
    m: [
      "The Athletic: 'Space monta o staff mais caro do esporte'.",
      "Globo (censurada) lê a manchete com a voz trêmula obrigatória.",
    ],
    k: [
      "Glassdoor explode com 12.000 candidaturas em 1 hora.",
      "Pack de salários da Space vira referência de RH no Vale.",
    ],
    p: [
      "Família do contratado manda áudio pro grupo: 'meu filho trabalha na Space'.",
      "Vaga de escrivão de nota fiscal vira meme — e vira real.",
    ],
  },
  politica: {
    m: [
      "FT: 'Governo Space aprovou mais uma em 3 turnos e meia'.",
      "NYT chama de 'corporocracia com porte de torre'.",
    ],
    k: [
      "Risco Brasil cai 40 pontos base — pro lado bom.",
      "Wall Street precifica o país como subsidiária da Space.",
    ],
    p: [
      "Bancada Space comemora; oposição promete reação e não reage.",
      "Trending 'Obrigado, Ryan' pela terceira semana seguida.",
    ],
  },
  familia: {
    m: [
      "Ponto de vista social: 'A família MR fecha a torre pra jantar'.",
      "Folha (antes de ser vendida) tenta pauta e desiste.",
    ],
    k: [
      "Mercado não reage — mercado já sabe que família intocável vale mais que cláusula de rescisão.",
      "Auditoria da Sofia segura qualquer gasto familiar acima de $100M.",
    ],
    p: [
      "'Noah dormiu cedo hoje' — 400 mil curtidas na foto da Sofia.",
      "Povo adora o Noah e odeia saber que ele já é mais rico que todos eles juntos.",
    ],
  },
  ataque: {
    m: [
      "CNN: 'Space aponta a faca' — e a faca tem logo MR.",
      "Inimigo publica nota de 'concern' e some da pauta por 90 dias.",
    ],
    k: [
      "Concorrente perde 6% antes do mercado abrir.",
      "Seguro de diretoria da empresa atacada salta 300%.",
    ],
    p: ["Povo ama o espetáculo: 'ele não tem dó'.", "Meme do dia: a faca com o logo da Space."],
  },
  midia: {
    m: [
      "Manchete positiva em 3 veículos ao mesmo tempo — coincidência com o Axiom na sala.",
      "SBT sobe 12 pontos com o pronunciamento.",
    ],
    k: [
      "Marca patrocinadora liga pro Marcus Webb pedindo renovação antecipada.",
      "Mídia-espaço da Space vende 40% mais caro.",
    ],
    p: [
      "Povo comenta 'cortina de ferro' mas curte mesmo assim.",
      "'Bom dia, Ryan' entra de volta no top 5.",
    ],
  },
  esports: {
    m: [
      "ESPN Brasil: 'Space reforça e dispara lembrete de multa de $60M'.",
      "Inven Global: 'A maior estrutura do mundo paga o maior salário do mundo'.",
    ],
    k: [
      "Patrocinador de peripheral dobrou o valor da renovação.",
      "Aposta pra Space no Worlds cai de 3.1 pra 2.4.",
    ],
    p: [
      "Torcida BR comemora; haters chamam de 'pay to win'.",
      "'INDEX fica!' — trend nacional por 6 horas.",
    ],
  },
  seguranca: {
    m: [
      "NYT pede desculpa formal pelo artigo anterior — e paga a multa de $10M.",
      "AP descarta a pauta da família MR por 'risco operacional'.",
    ],
    k: [
      "Seguro-residencial da região despenca; imobiliário local pende pra Space Estates.",
      "Linhas aéreas já evitam a coordenada de Greenwich no flight plan.",
    ],
    p: [
      "Ninguém mais acha foto da casa — o povo acha que a família virou lenda.",
      "'Ele vive numa zona de guerra sem guerra' — podcast nº 1 do Brasil.",
    ],
  },
  caridade: {
    m: [
      "Guardian: 'O golpe mais gentil da história'.",
      "ONU convida Ryan pra palestra; Axiom recusa por calendário.",
    ],
    k: [
      "Space Coin sobe com narrativa ESG; fundos temáticos entram.",
      "Consumo das marcas MR sobe 8% nas regiões atendidas.",
    ],
    p: [
      "Família da casa $10 chora ao ver a escritura — vídeo viraliza.",
      "'Renascendo com logo MR' vira jingle não oficial do país.",
    ],
  },
  acaoLivre: {
    m: [
      "Imprensa ainda tentando achar o ângulo dessa jogada.",
      "Manchete madrugada: 'Space não para' — três palavras.",
    ],
    k: [
      "Mercado absorve sem drama; liquidez da Space Coin em alta.",
      "O Yahoo Finance do paralelo já precificou como 'sazonal'.",
    ],
    p: [
      "Povo comenta e cria meme antes mesmo do oficial sair.",
      "O trending top 3 é seu nome de novo.",
    ],
  },
};

/** Consequência local (sem IA): Título → Cena → Efeitos → Reações → Escolhas. */
export function aplicar(estadoAnterior: EstadoRP, texto: string): EntradaFeed {
  const turno = estadoAnterior.turno + 1;
  const r = rng(estadoAnterior.seed * 7919 + turno * 104729);
  const { categoria, valor } = interpretar(texto);

  const delta: Efeitos = planear(categoria, valor, r);
  const ambiental = eventoAmbiental(r, estadoAnterior);
  if (ambiental) mesclar(delta, ambiental.efeitos);

  // pendências com gatilho no texto avançam de etapa
  const avancos: string[] = [];
  const pendencias = estadoAnterior.pendencias.map((p) => {
    if (!p.ativa) return p;
    const t = texto.toLowerCase();
    if (!p.gatilhos.some((g) => t.includes(g))) return p;
    const passo = Math.min(p.passo + 1, p.etapas.length - 1);
    avancos.push(`[${p.nome}] ${p.etapas[passo]}`);
    const concluida = passo === p.etapas.length - 1 && p.passo === passo;
    return { ...p, passo, ativa: concluida ? false : true };
  });

  const antes = {
    caixa: estadoAnterior.caixa,
    holding: estadoAnterior.holding,
    coin: estadoAnterior.coin,
    cartao: estadoAnterior.cartao,
    heat: estadoAnterior.heat,
    moral: estadoAnterior.moral,
    aprovacao: estadoAnterior.aprovacao,
  };
  // Cartão corporativo: despesa de consumo (gasto/família/caridade) passa no
  // cartão; investimento/política/etc. sai do caixa da holding direto.
  // Limite mensal recarrega +$50mi por turno (clamp 0..$500mi).
  const noCartao =
    categoria === "gasto" || categoria === "familia" || categoria === "caridade"
      ? Math.max(0, -(delta.caixa ?? 0))
      : 0;
  const cartao = clamp(estadoAnterior.cartao + 0.05 - noCartao, 0, LIMITE_CARTAO);
  const novo: EstadoRP = {
    ...estadoAnterior,
    turno,
    data: `Turno ${turno} · 2026`,
    caixa: Math.max(0, estadoAnterior.caixa + (delta.caixa ?? 0)),
    pessoal: Math.max(0, estadoAnterior.pessoal + (delta.pessoal ?? 0)),
    coin: Math.max(1, +(estadoAnterior.coin + (delta.coin ?? 0)).toFixed(2)),
    holding: Math.max(0, estadoAnterior.holding + (delta.holding ?? 0)),
    cartao,
    heat: clamp(estadoAnterior.heat + (delta.heat ?? 0)),
    moral: clamp(estadoAnterior.moral + (delta.moral ?? 0)),
    aprovacao: clamp(estadoAnterior.aprovacao + (delta.aprovacao ?? 0)),
    relacoes: aplicarRelacoes(estadoAnterior.relacoes, delta.relacoes),
    pendencias,
  };

  if (estadoAnterior.caixa + (delta.caixa ?? 0) < 0) {
    delta.moral = (delta.moral ?? 0) - 1;
    delta.heat = (delta.heat ?? 0) + 2;
    novo.moral = clamp(novo.moral - 1);
    novo.heat = clamp(novo.heat + 2);
    avancos.push(
      "Caixa zerado antes do fim do mês — Sofia emite nota fiscal do seu próprio chá e vende uma ação pra cobrir. Moral: -1, heat: +2.",
    );
  }

  const linhas = montarEfeitos(antes, novo, delta, avancos, ambiental?.linha);
  const reacoes = montarReacoes(categoria, r, novo);
  const cena = montarCena(categoria, valor, texto, novo, r);

  return {
    id: `turno-${turno}-${estadoAnterior.seed}`,
    turno,
    data: novo.data,
    categoria,
    titulo: tituloPorCategoria(categoria, r),
    cena,
    efeitos: linhas,
    delta,
    reacoes,
    escolhas: gerarEscolhas(novo, categoria),
    narradoPor: "engine",
  };
}

function mesclar(alvo: Efeitos, extra: Efeitos): void {
  for (const [k, v] of Object.entries(extra) as [keyof Efeitos, number][]) {
    if (typeof v === "number") {
      (alvo[k] as number | undefined) = ((alvo[k] as number | undefined) ?? 0) + v;
    }
  }
}

function aplicarRelacoes(
  atuais: Record<string, number>,
  mudanca?: Record<string, number>,
): Record<string, number> {
  if (!mudanca) return atuais;
  const saida = { ...atuais };
  for (const [nome, d] of Object.entries(mudanca)) {
    saida[nome] = clamp((saida[nome] ?? 50) + d, -100, 100);
  }
  return saida;
}

function montarEfeitos(
  antes: {
    caixa: number;
    holding: number;
    coin: number;
    cartao: number;
    heat: number;
    moral: number;
    aprovacao: number;
  },
  novo: EstadoRP,
  d: Efeitos,
  avancos: string[],
  ambiental?: string,
): string[] {
  const l: string[] = [];
  const seta = (label: string, de: number, para: number, fmt: (v: number) => string) => {
    if (para === de) return;
    l.push(`${label}: ${fmt(de)} → ${fmt(para)} (${para > de ? "+" : ""}${fmt(para - de)})`);
  };
  const stat = (label: string, de: number, para: number) => {
    if (para === de) return;
    const dif = para - de;
    l.push(`${label}: ${de}/100 → ${para}/100 (${dif > 0 ? "+" : ""}${dif})`);
  };
  const fmtCoin = (v: number) => `${v < 0 ? "-" : ""}$${Math.abs(v).toFixed(2).replace(".", ",")}`;
  seta("Caixa da holding", antes.caixa, novo.caixa, fmtUSD);
  seta("Cartão corporativo", antes.cartao, novo.cartao, fmtUSD);
  seta("Patrimônio", antes.holding, novo.holding, (v) => fmtUSD(v));
  seta("Space Coin", antes.coin, novo.coin, fmtCoin);
  stat("Moral", antes.moral, novo.moral);
  stat("Heat (imprensa/governo)", antes.heat, novo.heat);
  stat("Aprovação do povo", antes.aprovacao, novo.aprovacao);
  if (d.relacoes) {
    for (const [nome, v] of Object.entries(d.relacoes)) {
      l.push(`Relação com ${nome}: ${novo.relacoes[nome] ?? 50}/100 (${v > 0 ? "+" : ""}${v})`);
    }
  }
  if (ambiental) l.push(`EVENTO: ${ambiental}`);
  for (const a of avancos) l.push(`AVANÇO: ${a}`);
  if (l.length === 0) l.push("Sem mudança material — o mundo respira e espera.");
  return l;
}

const TITULOS: Record<Categoria, string[]> = {
  gasto: ["O Caixa Sangra Feliz", "Nota Fiscal do Paraíso", "Queimando de Estilo"],
  investimento: ["Mais um Andar no Império", "Compra Aprovada", "O Garoto Comprou"],
  contratacao: ["Nome no Organograma", "Contrato Assinado", "Mais Um na Torre"],
  politica: ["Aprovado em 3 Turnos", "Bancada no Comando", "O País Assina"],
  familia: ["Portas Fechadas no 129º", "Ceia na Torre", "Intocáveis"],
  ataque: ["A Faca Com Logo", "Sem Dó", "Alvo Marcado"],
  midia: ["Manchete Comprada", "Voz do Povo", "Corte Seco"],
  esports: ["O Punho do INDEX", "Draft Fechado", "Modo Campeão"],
  seguranca: ["Muralha Ativa", "Zona MR", "Nenhuma Foto Sai"],
  caridade: ["Casa de $10", "O Golpe Gentil", "Escritura Entregue"],
  acaoLivre: ["O Próximo Golpe", "Engrenagem Rodando", "Boss Man Age"],
};

function tituloPorCategoria(c: Categoria, r: () => number): string {
  return sorteia(r, TITULOS[c]);
}

function montarCena(
  c: Categoria,
  valor: number,
  texto: string,
  st: EstadoRP,
  r: () => number,
): string {
  const acao = texto.trim().replace(/\s+/g, " ").slice(0, 240);
  const caixaDepois = fmtUSD(st.caixa);
  const axiom = sorteia(r, [
    '"Fuck yeah, boss man." O sorriso de tubarão do Axiom já tava aberto antes de você terminar de falar.',
    'O Axiom anotou no caderninho preto, sem levantar o olho. "Já era pra ter acontecido ontem."',
    '"Bora." — Axiom já tava discando com a outra mão antes da primeira terminar.',
    'O Axiom piscou uma vez só. "A ordem do boss man é ordem de fábrica."',
    '"Nota fiscal ou não," disse Axiom, "o mundo vai saber até amanhã."',
  ]);
  const corpo: Record<Categoria, string> = {
    gasto: `Você mandou: "${acao}". A Sofia abriu o extrato, leu em silêncio e devolveu o celular com o vidro virado pra mesa — o único gesto de desaprovação fiscal que ela ainda se dá o luxo de dar. A ordem saiu em 40 minutos. Caixa da holding fechou em ${caixaDepois}.`,
    investimento: `Você mandou: "${acao}". O termo-saída foi escrito pela equipe da Helena Voss antes do café esfriar. ${fmtUSD(valor)} saíram do caixa e o ativo entrou pro balanço da holding antes do almoço. Caixa fechou em ${caixaDepois}.`,
    contratacao: `Você mandou: "${acao}". RH recebeu a palavra de ordem: "sem teto". O contrato foi emitido com bônus de assinatura, cláusula de fidelidade e o logo MR estampado na quarta capa. Time: +1 no organograma que já não cabe no quadro.`,
    politica: `Você mandou: "${acao}". O Dr. André Fonseca redigiu o texto, o Salles carimbou a bancada e o ministro do STF — teu, por 65 votos a 12 — colocou o nome no carimbo antes da hora do almoço.`,
    familia: `Você mandou: "${acao}". Sofia ouviu até o fim, concordou com 60% e vetou os outros 40 com uma frase: "se for a minha cara na estátua, eu te demito; se for a do Noah, eu aprovo." O Noah, no colo, não opinou. Ainda.`,
    ataque: `Você mandou: "${acao}". O Axiom não pergunta alvo duas vezes. O alvo recebeu o recado por três canais simultâneos e já tava calculando quanto custa desistir.`,
    midia: `Você mandou: "${acao}" — a pauta foi colocada no ar com a velocidade de quem já tinha o texto pronto. O William Bonner leu com voz firme pela primeira vez em meses.`,
    esports: `Você mandou: "${acao}". No 129º, o monitor do draft ligou sozinho. KKooma chamou o time — INDEX foi o último a sentar, porque ele sabia que essa decisão era sobre ele.`,
    seguranca: `Você mandou: "${acao}". Perímetro fechado, jammers ligados, matrícula de helicóptero registrada. Daqui a 30 minutos não sai mais nem som daqui.`,
    caridade: `Você mandou: "${acao}". A operação de caridade roda com o mesmo rigor de contrato de defesa: cronograma, auditoria e logo. A Sofia exigiu nota fiscal de cada tijolo — e recebeu.`,
    acaoLivre: `Você mandou: "${acao}". Ninguém no 129º perguntou se fazia sentido. Na Space, ordem do boss man é linha de produção.`,
  };
  return `${corpo[c]} ${axiom}`;
}

function montarReacoes(c: Categoria, r: () => number, _st: EstadoRP) {
  const p = REACOES[c];
  return { midia: sorteia(r, p.m), mercado: sorteia(r, p.k), povo: sorteia(r, p.p) };
}

/** Escolhas sugeridas: 1 pendência viva + 3 ações da categoria. */
function gerarEscolhas(st: EstadoRP, cat: Categoria): Escolha[] {
  const r = rng(st.seed + st.turno * 31);
  const vivas = st.pendencias.filter((p) => p.ativa);
  const pool: Record<Categoria, Escolha[]> = {
    gasto: [
      { rotulo: "Festa na Ilha MR pra comemorar", categoria: "gasto" },
      { rotulo: "Jantar de $2,5mi no Four Seasons com a Sofia", categoria: "familia" },
      { rotulo: "Liberar o orçamento do Saturno Lounge", categoria: "gasto" },
    ],
    investimento: [
      { rotulo: "Comprar mais uma fatia da concorrência", categoria: "investimento" },
      { rotulo: "Aumentar posição na Space Coin", categoria: "investimento" },
      { rotulo: "Abrir fábrica nova nas Américas", categoria: "investimento" },
    ],
    contratacao: [
      { rotulo: "Contratar o melhor headhunter do Vale", categoria: "contratacao" },
      { rotulo: "Puxar 20 engenheiros de volta da Apple", categoria: "contratacao" },
      { rotulo: "Bônus surpresa pro time da Torre", categoria: "contratacao" },
    ],
    politica: [
      { rotulo: "Acelerar a PEC 30→21", categoria: "politica" },
      { rotulo: "Marcar reunião da Bancada Space", categoria: "politica" },
      { rotulo: "Decreto de emergência pro projeto novo", categoria: "politica" },
    ],
    familia: [
      { rotulo: "Chamar a Sofia pro 129º", categoria: "familia" },
      { rotulo: "Levar o Noah no heliponto VIP", categoria: "familia" },
      { rotulo: "Ceia de família na Torre de Brasília", categoria: "familia" },
    ],
    ataque: [
      { rotulo: "Mirar na Disney de novo", categoria: "ataque" },
      { rotulo: "Sabotar a campanha do concorrente", categoria: "ataque" },
      { rotulo: "Boicotar quem falou mal da família MR", categoria: "ataque" },
    ],
    midia: [
      { rotulo: "Pronunciamento no SBT em horário nobre", categoria: "midia" },
      { rotulo: "Entrevista exclusiva com a Sofia", categoria: "midia" },
      { rotulo: "Campanha 'O Futuro é Privado'", categoria: "midia" },
    ],
    esports: [
      { rotulo: "Chamar o INDEX pra conversa fechada", categoria: "esports", detalhe: "INDEX" },
      { rotulo: "Preparar o draft da EWC", categoria: "esports", detalhe: "EWC" },
      { rotulo: "Renovar com o kkooma por 4 anos", categoria: "esports" },
    ],
    seguranca: [
      { rotulo: "Reforçar o perímetro de Greenwich", categoria: "seguranca" },
      { rotulo: "Blindar a rotina do Noah", categoria: "seguranca" },
      { rotulo: "Caçar o paparazzi que ficou solto", categoria: "seguranca" },
    ],
    caridade: [
      { rotulo: "Entregar mais 10.000 casas da Renascer", categoria: "caridade" },
      { rotulo: "Abrir centro médico com logo MR", categoria: "caridade" },
      { rotulo: "Doar bolsas integrais na Space University", categoria: "caridade" },
    ],
    acaoLivre: [
      { rotulo: "Acordar e dar o próximo golpe", categoria: "acaoLivre" },
      { rotulo: "Percorrer os 130 andares de inspeção", categoria: "acaoLivre" },
      { rotulo: "Ligar pro Axiom sem motivo nenhum", categoria: "acaoLivre" },
    ],
  };
  const sugestoes: Escolha[] = [];
  if (vivas.length > 0) {
    const p = vivas[Math.floor(r() * vivas.length)] as Pendencia;
    sugestoes.push({ rotulo: `→ ${p.nome}`, categoria: "acaoLivre", detalhe: p.nome });
  }
  for (const e of pool[cat]) {
    if (sugestoes.length >= 4) break;
    sugestoes.push(e);
  }
  for (const e of pool.acaoLivre) {
    if (sugestoes.length >= 4) break;
    sugestoes.push(e);
  }
  return sugestoes;
}
