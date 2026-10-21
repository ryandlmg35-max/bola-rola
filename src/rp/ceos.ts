import type { EstadoRP } from "./types";
import { fmtUSD } from "./engine";
import { rng, sorteia } from "./rng";

/**
 * Sistema de chat com CEOs — respostas locais, sem IA.
 * O tom muda com o nível de relação (relacoes[nome]):
 *   >= 85 → íntimo   (casual, pessoal, aliança total)
 *   70–84 → aliado   (caloroso, colaborativo)
 *   50–69 → neutro   (profissional, formal)
 *   30–49 → tenso    (guarda, cobra, passivo-agressivo)
 *   10–29 → frio     (mínimo, distante)
 *   < 10  → hostil   (confrontacional, mal coopera)
 */

export type NivelRelacao = "intimo" | "aliado" | "neutro" | "tenso" | "frio" | "hostil";

export function nivelRelacao(valor: number): NivelRelacao {
  if (valor >= 85) return "intimo";
  if (valor >= 70) return "aliado";
  if (valor >= 50) return "neutro";
  if (valor >= 30) return "tenso";
  if (valor >= 10) return "frio";
  return "hostil";
}

export interface PerfilCEO {
  id: string;
  nome: string;
  relacaoChave: string; // chave em estado.relacoes
  divisao: string;
  cargo: string;
}

export const PERFIS_CEO: PerfilCEO[] = [
  {
    id: "media",
    nome: "Daniel Cross",
    relacaoChave: "Daniel Cross",
    divisao: "Space Media & Entertainment",
    cargo: "CEO",
  },
  {
    id: "tech",
    nome: "Priya Anand",
    relacaoChave: "Priya Anand",
    divisao: "Space Tech & Comunicação",
    cargo: "CEO",
  },
  {
    id: "sports",
    nome: "Marcus Webb",
    relacaoChave: "Marcus Webb",
    divisao: "Space Sports",
    cargo: "CEO",
  },
  {
    id: "esports",
    nome: "Victor Vit",
    relacaoChave: "Victor Vit Salomão",
    divisao: "Space Esports",
    cargo: "CEO",
  },
  {
    id: "consumer",
    nome: "Camila Duarte",
    relacaoChave: "Camila Duarte",
    divisao: "Space Consumer",
    cargo: "CEO",
  },
  {
    id: "interactive",
    nome: "Celo Tavares",
    relacaoChave: "Celo Tavares",
    divisao: "Space Interactive",
    cargo: "CEO",
  },
  {
    id: "ventures",
    nome: "Rafael Noguera",
    relacaoChave: "Rafael Noguera",
    divisao: "Space Ventures / Lifestyle",
    cargo: "CEO",
  },
  { id: "ai", nome: "Elon Musk", relacaoChave: "Elon Musk", divisao: "Space AI", cargo: "Co-CEO" },
  {
    id: "investments",
    nome: "Helena Voss",
    relacaoChave: "Helena Voss",
    divisao: "Space Investments",
    cargo: "CEO",
  },
  {
    id: "foundries",
    nome: "Jeff Williams",
    relacaoChave: "Jeff Williams",
    divisao: "Space Foundries",
    cargo: "CEO",
  },
  {
    id: "ocean",
    nome: "Dr. Elias Vance",
    relacaoChave: "Dr. Elias Vance",
    divisao: "Space Ocean",
    cargo: "CEO",
  },
  {
    id: "ilha",
    nome: "Isabella Mendes",
    relacaoChave: "Isabella Mendes",
    divisao: "Ilha MR",
    cargo: "CEO",
  },
];

export function perfilPorId(id: string): PerfilCEO | undefined {
  return PERFIS_CEO.find((p) => p.id === id);
}

// ─────────────────────────────────────────────────────────────────────────────
// DANIEL CROSS — Space Media & Entertainment (relação: -35)
// Arrogante, ex-Hollywood, em conflito com Ryan desde a Operação Mãos Limpas.
// ─────────────────────────────────────────────────────────────────────────────
function cross(estado: EstadoRP, texto: string, nivel: NivelRelacao, r: () => number): string {
  const div = estado.divisoes.find((d) => d.id === "media");
  const t = texto.toLowerCase();
  if (nivel === "hostil" || nivel === "frio") {
    if (/(paramount|integração|integracao|conteúdo|conteudo|streaming)/.test(t)) {
      return sorteia(r, [
        "A integração da Paramount está em 85%. Meu time executa sem precisar desta ligação, Dalbert.",
        "Integração on track. Se quiser interferir, manda por escrito pro jurídico.",
      ]);
    }
    if (/(orçamento|orcamento|verba|investimento)/.test(t)) {
      return sorteia(r, [
        "Minha diretoria de conteúdo precisa de $200mi pra 2027. Não estou pedindo — estou informando o que é necessário pro resultado que você quer.",
        "Orçamento está no relatório mensal. Seção 4, página 11. Leia.",
      ]);
    }
    return sorteia(r, [
      "Pode mandar pelo assistente, Dalbert. Eu respondo em 48h úteis.",
      "O que precisa? Tenho uma reunião em 12 minutos.",
      "Seja direto. Meu tempo é tão escasso quanto o seu — e o meu vale mais por hora.",
    ]);
  }
  if (nivel === "tenso") {
    return sorteia(r, [
      `Space Media fechou ${div?.receita ?? "$21,8bi"} de receita este mês. Os números falam por si. O que mais precisa?`,
      "Posso atender, mas que fique claro: minha divisão performa acima da meta com ou sem microgestão.",
    ]);
  }
  // neutro+ (nunca deve acontecer com -35, mas como fallback)
  return `Cross aqui. ${div?.receita ?? "$21,8bi"} de receita, integração da Paramount a 85%. O que quer saber?`;
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIYA ANAND — Space Tech & Comunicação (relação: 78)
// Ex-Apple engineer. Intensa, técnica, apaixonada por produto.
// ─────────────────────────────────────────────────────────────────────────────
function priyaAnand(estado: EstadoRP, texto: string, nivel: NivelRelacao, r: () => number): string {
  const div = estado.divisoes.find((d) => d.id === "tech");
  const t = texto.toLowerCase();
  if (/(data center|servidor|infra|chip|ia|ai|computação|computacao)/.test(t)) {
    if (nivel === "intimo" || nivel === "aliado") {
      return sorteia(r, [
        "Precisamos dos $4bi em data centers AGORA, Ryan. A Space AI vai precisar de infra antes de faturar — e se a gente não construir, vai alugar da AWS pelo dobro do preço.",
        "Eu li o roadmap da OpenAI. Temos 18 meses de vantagem se você liberar o budget de infra hoje. 18 meses, Ryan. Isso é tudo.",
      ]);
    }
    return `Os data centers de $4bi estão pendentes. É prioridade máxima pra mim, Sr. Dalbert. A divisão de IA não cresce sem infra própria.`;
  }
  if (/(instagram|whatsapp|rede social|plataforma)/.test(t)) {
    if (nivel === "intimo" || nivel === "aliado") {
      return sorteia(r, [
        "Instagram e WhatsApp juntos dão $18,6bi de receita porque eu bati de frente com Zuckerberg por 3 anos antes de você comprar. Cuida bem do que custou tanto.",
        "As plataformas estão saudáveis. Mas a Apple ainda contrata os meus melhores engenheiros. Me dá headcount ou eu começo a perder para eles.",
      ]);
    }
    return `Space Tech & Comunicação: ${div?.receita ?? "$18,6bi"} de receita. As plataformas performam dentro do esperado.`;
  }
  if (nivel === "intimo") {
    return sorteia(r, [
      `Ryan, você me deve um café. Dito isso — como posso ajudar?`,
      `Tô no meio de um code review mas pode falar, você sabe que eu atendo. O que aconteceu?`,
      `${div?.receita ?? "$18,6bi"} de receita esse mês e o time ainda me pediu pizza comemorativa. Mandei sushi — eles merecem mais. O que você precisa?`,
    ]);
  }
  if (nivel === "aliado") {
    return sorteia(r, [
      `Space Tech performando bem — ${div?.receita ?? "$18,6bi"} de receita, ${div?.lucro ?? "$8,9bi"} de lucro. Mas precisamos conversar sobre o budget de data centers.`,
      `Olá, Ryan. Tudo certo por aqui. O que posso fazer?`,
    ]);
  }
  return `Sr. Dalbert. Space Tech está em ${div?.receita ?? "$18,6bi"} de receita mensal. O que precisa?`;
}

// ─────────────────────────────────────────────────────────────────────────────
// MARCUS WEBB — Space Sports (relação: 76)
// Ex-agente esportivo americano. Casual, fala de atletas e contratos.
// ─────────────────────────────────────────────────────────────────────────────
function webb(estado: EstadoRP, texto: string, nivel: NivelRelacao, r: () => number): string {
  const div = estado.divisoes.find((d) => d.id === "sports");
  const t = texto.toLowerCase();
  if (/(cowboys|arsenal|grizzlies|nfl|nba|premier|reforço|reforco|jogador|atleta)/.test(t)) {
    if (nivel === "intimo" || nivel === "aliado") {
      return sorteia(r, [
        "Ryan, você me deu os Cowboys, o Arsenal e o Grizzlies. Agora me dá os $300mi de reforço e eu te entrego um campeonato — pode escolher qual.",
        "Cara, o mercado de janela abre em 3 semanas. Tenho 4 nomes na mesa que mudam o jogo. Preciso do sinal verde e do cheque.",
      ]);
    }
    return `Space Sports está em ${div?.receita ?? "$420mi"} de receita mensal. Cowboys, Arsenal e Grizzlies operando. Aguardamos autorização pro orçamento de $300mi de reforços.`;
  }
  if (nivel === "intimo") {
    return sorteia(r, [
      "Ei! Que foi, chefe? Tô aqui entre uma reunião com o agente do Dak e outra com o Arsenal. Manda ver.",
      "Diga, Ryan! A gente tá construindo algo histórico aqui — o que você precisa?",
    ]);
  }
  if (nivel === "aliado") {
    return sorteia(r, [
      `Marcus Webb, Space Sports. Receita em ${div?.receita ?? "$420mi"}, tudo sob controle. Precisamos conversar sobre reforços.`,
      `Ryan, tô de olho em uns atletas que podem mudar tudo. Quando bater um papo?`,
    ]);
  }
  return `Sr. Dalbert. Space Sports — ${div?.receita ?? "$420mi"} mensal. O que precisa saber?`;
}

// ─────────────────────────────────────────────────────────────────────────────
// VICTOR "VIT" SALOMÃO — Space Esports (relação: 80)
// Brasileiro, gamer. Fala de INDEX, KKooma, League, EWC.
// ─────────────────────────────────────────────────────────────────────────────
function vit(estado: EstadoRP, texto: string, nivel: NivelRelacao, r: () => number): string {
  const div = estado.divisoes.find((d) => d.id === "esports");
  const t = texto.toLowerCase();
  if (/(index|adc|renovação|renovacao|contrato|jdg|t1|faker|lck)/.test(t)) {
    if (nivel === "intimo" || nivel === "aliado") {
      return sorteia(r, [
        "Cara, o INDEX tá com o cérebro fritando nessa situação. JDG ofereceu $1,4M/mês — eu vi o contrato. Se a Space não mover agora, a gente perde o melhor ADC do mundo. Fala com ele, Ryan. Só você consegue.",
        "INDEX quer ficar. Eu sei disso porque ele me ligou às 2h perguntando se você ia aparecer no treino. É sinal. Libera a renovação.",
      ]);
    }
    return `A situação do INDEX é crítica. A multa de $60M segura por ora, mas precisamos agir. ${div?.nota ?? ""}`;
  }
  if (/(kkooma|coach|treino|draft|estratégia|estrategia|ewc|worlds|campeonato)/.test(t)) {
    if (nivel === "intimo" || nivel === "aliado") {
      return sorteia(r, [
        "KKooma é o melhor coach do mundo — e sabe disso. Me deixa na paz pra ele preparar o draft da EWC sem pressão de cima.",
        "O draft tá fechado. KKooma passou 14 horas no simulador do 129º andar. Essa equipe vai dar trabalho pra todo mundo.",
      ]);
    }
    return `Coach KKooma e time em preparação para a EWC. O draft está em desenvolvimento. ${div?.nota ?? ""}`;
  }
  if (nivel === "intimo") {
    return sorteia(r, [
      "Ae Ryan! Que foi? Tô aqui no bootcamp com o INDEX. A galera tá boa, mas precisa de uma palavra sua pra acreditar mais.",
      "Fala comigo! A Space Esports sangra mas brilha, chefe. O que você precisa?",
    ]);
  }
  if (nivel === "aliado") {
    return sorteia(r, [
      `Vit aqui. Esports em ${div?.lucro ?? "-$68,5mi"} de lucro — sim, é prejuízo, mas é despesa estratégica que você mesmo aprovou. O que precisa?`,
      `Ryan, boa. O time tá treinando pesado. Algo específico que queira saber?`,
    ]);
  }
  return `Sr. Dalbert. Space Esports operando. ${div?.nota ?? ""} Pode falar.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// CAMILA DUARTE — Space Consumer (relação: 74)
// Brasileira, orgulhosa do Apex. Fala de fábricas e crescimento.
// ─────────────────────────────────────────────────────────────────────────────
function camila(estado: EstadoRP, texto: string, nivel: NivelRelacao, r: () => number): string {
  const div = estado.divisoes.find((d) => d.id === "consumer");
  const t = texto.toLowerCase();
  if (
    /(apex|fábrica|fabrica|produção|producao|mercado|consumidor|concorrência|concorrencia)/.test(t)
  ) {
    if (nivel === "intimo" || nivel === "aliado") {
      return sorteia(r, [
        "Ryan, o Apex tem fila de 90 dias e a concorrência copiou o playbook — mas copiou errado. A gente tem 50 fábricas em 23 países. Eles ainda estão abrindo a segunda.",
        "Tô abrindo mais 8 fábricas em Asia-Pacífico. Se você me der mais $2bi, dobro isso. O Apex é o produto mais desejado do mundo agora — não é hora de ser conservador.",
      ]);
    }
    return `Space Consumer: ${div?.receita ?? "$2,01bi"} de receita, crescendo. Apex com demanda recorde. ${div?.nota ?? ""}`;
  }
  if (nivel === "intimo") {
    return sorteia(r, [
      "Ryan! Que bom. Posso te contar uma coisa? A fábrica de Monterrey que o Goldman reportou — é nossa resposta. Não dei entrevista ainda, mas o produto vai ser anunciado antes deles terminarem a construção deles.",
      "Eae chefe! Pode falar, tô aqui.",
    ]);
  }
  if (nivel === "aliado") {
    return sorteia(r, [
      `Camila aqui. Consumer em ${div?.receita ?? "$2,01bi"} — crescendo forte. O que precisa saber?`,
      `Bom dia! Apex vendendo bem. Posso ajudar?`,
    ]);
  }
  return `Sra. Duarte, Space Consumer. Receita ${div?.receita ?? "$2,01bi"}. O que o Sr. Dalbert precisa?`;
}

// ─────────────────────────────────────────────────────────────────────────────
// CELO TAVARES — Space Interactive (relação: 82)
// Baseado no Japão. Calmo, criativo, fala de games e do jogo do INDEX.
// ─────────────────────────────────────────────────────────────────────────────
function celo(estado: EstadoRP, texto: string, nivel: NivelRelacao, r: () => number): string {
  const div = estado.divisoes.find((d) => d.id === "interactive");
  const t = texto.toLowerCase();
  if (
    /(jogo|game|index game|space legends|pré-venda|pre-venda|lançamento|lancamento|japão|japon|nintendo|sony)/.test(
      t,
    )
  ) {
    if (nivel === "intimo" || nivel === "aliado") {
      return sorteia(r, [
        "Ryan-san, o jogo do INDEX tem 4 milhões de pré-vendas e ainda não anunciamos a data de lançamento. Quando você der o sinal, isso vai explodir. Estou segurando propositalmente.",
        "Space Legends está em desenvolvimento para 2030 — mas o jogo do INDEX pode sair antes se você quiser acelerar. Diga uma palavra e eu monto o cronograma.",
      ]);
    }
    return `Space Interactive: ${div?.receita ?? "$950mi"} de receita. Jogo do INDEX com ${div?.nota?.includes("4mi") ? "4 milhões de pré-vendas" : "pré-vendas recordes"}. Aguardo instrução para data de lançamento.`;
  }
  if (nivel === "intimo") {
    return sorteia(r, [
      "Ryan. Bom ouvir você. Aqui em Tóquio já passa das 11h da noite — mas eu atendo você em qualquer hora. O que precisa?",
      "Boa noite daqui do Japão! O que posso fazer por você?",
    ]);
  }
  if (nivel === "aliado") {
    return sorteia(r, [
      `Celo Tavares, Space Interactive. ${div?.receita ?? "$950mi"} mensais, ${div?.lucro ?? "$313mi"} de lucro. Posso ajudar?`,
      `Olá, Ryan. Tudo bem por aqui. O que precisa?`,
    ]);
  }
  return `Sr. Dalbert. Space Interactive, ${div?.receita ?? "$950mi"} mensal. Como posso ajudar?`;
}

// ─────────────────────────────────────────────────────────────────────────────
// RAFAEL NOGUERA — Space Ventures / Lifestyle (relação: 72)
// SBT, mídia, entretenimento alternativo. Comunicativo, fala rápido.
// ─────────────────────────────────────────────────────────────────────────────
function noguera(estado: EstadoRP, texto: string, nivel: NivelRelacao, r: () => number): string {
  const div = estado.divisoes.find((d) => d.id === "ventures");
  const t = texto.toLowerCase();
  if (/(sbt|audiência|audiencia|novela|produtora|programa|entretenimento|mídia|midia)/.test(t)) {
    if (nivel === "intimo" || nivel === "aliado") {
      return sorteia(r, [
        "Ryan! SBT subiu 18% de audiência desde que a gente assumiu. A novela que a produtora está pedindo $80mi vai devolver $400mi em 2 anos. Faz as contas.",
        "O SBT é nossa arma de soft power. Enquanto a Globo agoniza, a gente cresce. Libera os $80mi da produtora e eu te entrego o prime time nacional.",
      ]);
    }
    return `Space Ventures — SBT com ${div?.nota?.includes("18%") ? "+18% de audiência" : "audiência crescendo"}. ${div?.receita ?? "$120mi"} de receita. ${div?.nota ?? ""}`;
  }
  if (nivel === "intimo" || nivel === "aliado") {
    return sorteia(r, [
      `Rafael Noguera! Pode falar, Ryan. Tô aqui entre uma gravação e outra. Ventures em ${div?.receita ?? "$120mi"} — pequeno mas consistente.`,
      `Eae! Pode falar. O que tá rolando?`,
    ]);
  }
  return `Noguera aqui, Space Ventures. ${div?.receita ?? "$120mi"} de receita. O que precisa, Sr. Dalbert?`;
}

// ─────────────────────────────────────────────────────────────────────────────
// ELON MUSK — Space AI, co-CEO (relação: 58)
// Genial e imprevisível. Mistura técnica com provocações.
// ─────────────────────────────────────────────────────────────────────────────
function elon(estado: EstadoRP, texto: string, nivel: NivelRelacao, r: () => number): string {
  const t = texto.toLowerCase();
  if (
    /(ia|ai|modelo|llm|data center|chip|computação|computacao|treino|training|grok|copilot)/.test(t)
  ) {
    if (nivel === "intimo" || nivel === "aliado") {
      return sorteia(r, [
        "A Space AI vai ser maior que a OpenAI. Isso não é previsão — é engenharia. Mas precisa dos $4bi em data centers. Cada dia de atraso é um mês de vantagem que a gente perde. Decida.",
        "Priya e eu temos o modelo rodando em beta. É absurdo. Mas sem infra a gente publica um paper científico em vez de um produto. Me dá os servidores.",
      ]);
    }
    if (nivel === "neutro") {
      return `Space AI em fase beta. O modelo está avançado, mas os $4bi em data centers são bloqueantes. A decisão precisa ser sua, Sr. Dalbert.`;
    }
    return `Estou ocupado com o modelo. Manda email.`;
  }
  if (nivel === "intimo") {
    return sorteia(r, [
      "Ryan. Bom timing — eu estava pensando em você. Tenho uma ideia que vai mudar o Space AI completamente. Quando podemos falar de verdade?",
      "Que foi? Tô no meio de um benchmark mas posso pausar pra você. Fala rápido ou fala tudo — você escolhe.",
    ]);
  }
  if (nivel === "aliado") {
    return sorteia(r, [
      `Elon. Space AI ainda não fatura mas o produto vai ser histórico. O que precisa?`,
      `Oi. Ocupado mas disponível. O que é?`,
    ]);
  }
  if (nivel === "tenso" || nivel === "frio") {
    return sorteia(r, ["Manda pro assistente da Priya.", "Ocupado. O que é em 30 palavras?"]);
  }
  return "Fala.";
}

// ─────────────────────────────────────────────────────────────────────────────
// HELENA VOSS — Space Investments (relação: 77)
// Europeia elegante. Linguagem financeira, conservadora mas sofisticada.
// ─────────────────────────────────────────────────────────────────────────────
function helena(estado: EstadoRP, texto: string, nivel: NivelRelacao, r: () => number): string {
  const div = estado.divisoes.find((d) => d.id === "investments");
  const t = texto.toLowerCase();
  if (
    /(aquisição|aquisicao|compra|wbd|fundo|ações|acoes|portfólio|portfolio|retorno|roi|dividendo)/.test(
      t,
    )
  ) {
    if (nivel === "intimo" || nivel === "aliado") {
      return sorteia(r, [
        `Ryan, nossa margem de ${div?.lucro ?? "$2,8bi"} em ${div?.receita ?? "$3,2bi"} de receita é 88% — o melhor do portfólio. A WBD eu rejeitei porque o preço não fazia sentido. Se quiser voltar ao tema, me traz uma oferta diferente.`,
        "O PIF quer 2% da Space AI por $40bi. Isso é avaliação de $2 trilhões para uma divisão pré-receita. Minha recomendação: negociar. Mas a decisão é sua.",
      ]);
    }
    return `Space Investments: ${div?.receita ?? "$3,2bi"} de receita, ${div?.lucro ?? "$2,8bi"} de lucro, margem de 88%. Posso elaborar sobre qualquer posição do portfólio.`;
  }
  if (nivel === "intimo") {
    return sorteia(r, [
      `Ryan. Sempre um prazer. O que posso fazer por você hoje?`,
      `Bom dia — ou boa tarde, dependendo de onde você está. Pode falar.`,
    ]);
  }
  if (nivel === "aliado") {
    return sorteia(r, [
      `Helena Voss, Space Investments. ${div?.receita ?? "$3,2bi"} de receita, margem de 88%. O que precisa, Ryan?`,
      `Olá. Tudo em ordem por aqui. Como posso ajudar?`,
    ]);
  }
  return `Sra. Voss, Space Investments. ${div?.receita ?? "$3,2bi"} mensais. O que o Sr. Dalbert precisa?`;
}

// ─────────────────────────────────────────────────────────────────────────────
// JEFF WILLIAMS — Space Foundries (relação: 85)
// Ex-Apple operations. Discreto, preciso, totalmente leal.
// ─────────────────────────────────────────────────────────────────────────────
function jeff(estado: EstadoRP, texto: string, nivel: NivelRelacao, r: () => number): string {
  const div = estado.divisoes.find((d) => d.id === "foundries");
  const t = texto.toLowerCase();
  if (
    /(14\.8|cláusula|clausula|gatilho|apple|iphone|chip|fornecimento|supply|fábrica|fabrica)/.test(
      t,
    )
  ) {
    if (nivel === "intimo" || nivel === "aliado") {
      return sorteia(r, [
        "Ryan. A cláusula 14.8 está rodando silenciosamente. Dia 1 rendeu $350mi. Tim Cook sabe, mas não tem o que fazer ainda — o contrato é de ferro. Quando você disser o nome, eu aciono.",
        "O gatilho está guardado exatamente onde você mandou. Não há pressa. Quando o momento chegar, eu estarei pronto antes de você terminar a frase.",
      ]);
    }
    return `Foundries em operação. Cláusula 14.8 ativa conforme instrução. ${div?.nota ?? ""} Aguardo sua ordem, Sr. Dalbert.`;
  }
  if (/(sindicato|greve|trabalhadores|operário|operario|turno)/.test(t)) {
    if (nivel === "intimo" || nivel === "aliado") {
      return sorteia(r, [
        "O sindicato está sob controle por enquanto. A assembleia aprovou estado de greve, mas uma parada de 48h custa $600mi — eles sabem disso e usam como barganha. Me diz se quer que eu negocie ou segure.",
        "Tô de olho na situação com o sindicato. Uma concessão pequena agora evita um problema grande depois. Me dá autonomia de até $50mi e eu resolvo sem barulho.",
      ]);
    }
    return `Situação com o sindicato: estado de greve aprovado. Custo estimado de parada: $600mi/48h. Aguardo instrução.`;
  }
  if (nivel === "intimo") {
    return sorteia(r, [
      "Ryan. Pode falar. Foundries roda $350mi por dia enquanto conversamos. O que precisa?",
      "Tô aqui. O que é?",
    ]);
  }
  if (nivel === "aliado") {
    return sorteia(r, [
      `Jeff Williams, Foundries. ${div?.receita ?? "$350mi/dia"} em operação. Como posso ajudar?`,
      `Boa. O que precisa, Ryan?`,
    ]);
  }
  return `Sr. Dalbert. Foundries operando. ${div?.receita ?? "$350mi/dia"}. O que precisa?`;
}

// ─────────────────────────────────────────────────────────────────────────────
// DR. ELIAS VANCE — Space Ocean (relação: 73)
// Científico, apaixonado por oceanografia. Fala de mineração marítima.
// ─────────────────────────────────────────────────────────────────────────────
function vance(estado: EstadoRP, texto: string, nivel: NivelRelacao, r: () => number): string {
  const div = estado.divisoes.find((d) => d.id === "ocean");
  const t = texto.toLowerCase();
  if (/(mineração|mineracao|noaa|ilhabela|oceano|marítimo|maritimo|subsolo|subsolo)/.test(t)) {
    if (nivel === "intimo" || nivel === "aliado") {
      return sorteia(r, [
        "Ryan, a aprovação de mineração marítima que obtivemos é histórica. Existem $12 trilhões em minerais no leito oceânico brasileiro. Não estou exagerando — é o número da NOAA. Quando você quiser começar, eu começo.",
        "A sede de Ilhabela está pronta. Temos o equipamento, temos a aprovação, temos a equipe. O que falta é uma palavra sua para iniciar a primeira extração comercial de mineração oceânica do Brasil.",
      ]);
    }
    return `Space Ocean: mineração marítima aprovada. Sede em Ilhabela operacional. ${div?.nota ?? ""} Aguardamos instrução para início das operações.`;
  }
  if (nivel === "intimo" || nivel === "aliado") {
    return sorteia(r, [
      `Elias Vance, Space Ocean. O oceano espera, Ryan. ${div?.nota ?? ""} O que precisa?`,
      `Bom falar com você. Temos oportunidades imensas aqui. O que é?`,
    ]);
  }
  return `Dr. Vance, Space Ocean. ${div?.nota ?? ""} Como posso ajudar, Sr. Dalbert?`;
}

// ─────────────────────────────────────────────────────────────────────────────
// ISABELLA MENDES — Ilha MR (relação: 80)
// Cunhada / meia-irmã da Sofia. Artista, CEO da ilha. Leve, afetiva.
// ─────────────────────────────────────────────────────────────────────────────
function isabella(estado: EstadoRP, texto: string, nivel: NivelRelacao, r: () => number): string {
  const div = estado.divisoes.find((d) => d.id === "ilha");
  const t = texto.toLowerCase();
  if (/(ilha|reserva|hóspede|hospede|resort|diária|diaria|chloé|chloe|caribe|bahamas)/.test(t)) {
    if (nivel === "intimo" || nivel === "aliado") {
      return sorteia(r, [
        "Ryan! A ilha está linda. 400 reservas, Bob Iger até voltou e pagou os $50mil/dia sem reclamar — uma foto no Instagram e ele virou cliente de novo. Quando você e a Sofia vêm?",
        "A Chloé está ótima, obrigada por perguntar. E a ilha fez $20mi este mês. Não é o Space Media, mas é meu e eu amo. O que você precisa?",
      ]);
    }
    return `Ilha MR: ${div?.receita ?? "$20mi+"} de receita, 400 reservas confirmadas. ${div?.nota ?? ""} O que precisa, Ryan?`;
  }
  if (/(sofia|Noah|família|familia)/.test(t)) {
    if (nivel === "intimo" || nivel === "aliado") {
      return sorteia(r, [
        "A Sofia me ligou semana passada. Ela não admite, mas precisa de férias. Traz ela pra ilha — eu cuido de tudo. A Chloé e o Noah na praia juntos seria perfeito.",
        "Família MR está bem? O Noah foi crescendo, né? Às vezes me pergunto se você percebe como o tempo passa rápido lá na torre.",
      ]);
    }
    return "A família está bem por aqui. A Chloé cresce feliz. Se precisar de algo, é só falar.";
  }
  if (nivel === "intimo") {
    return sorteia(r, [
      "Oi, Ryan! Que surpresa boa. Tô aqui olhando o pôr do sol no Caribe — não reclamo. O que posso fazer?",
      "Ryan! A ilha tá maravilhosa hoje. Vento bom, mar calmo, hóspedes felizes. Fala, o que é?",
    ]);
  }
  if (nivel === "aliado") {
    return sorteia(r, [
      `Isabella aqui. Ilha em ${div?.receita ?? "$20mi+"} de receita. Tudo tranquilo por aqui. O que precisa?`,
      `Oi! Tudo bem. Pode falar.`,
    ]);
  }
  return `Isabella Mendes, CEO da Ilha MR. ${div?.receita ?? "$20mi+"} mensal. O que precisa, Ryan?`;
}

// ─────────────────────────────────────────────────────────────────────────────
// DISPATCHER PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

/** Gera resposta local de qualquer CEO baseada no nível de relação. */
export function respostaCEO(estado: EstadoRP, divisaoId: string, texto: string): string {
  const perfil = perfilPorId(divisaoId);
  if (!perfil) return "Sem resposta.";

  const relValor = estado.relacoes[perfil.relacaoChave] ?? 50;
  const nivel = nivelRelacao(relValor);
  const r = rng((estado.seed ^ (estado.turno * 2654435761) ^ (texto.length * 104729)) >>> 0);

  switch (divisaoId) {
    case "media":
      return cross(estado, texto, nivel, r);
    case "tech":
      return priyaAnand(estado, texto, nivel, r);
    case "sports":
      return webb(estado, texto, nivel, r);
    case "esports":
      return vit(estado, texto, nivel, r);
    case "consumer":
      return camila(estado, texto, nivel, r);
    case "interactive":
      return celo(estado, texto, nivel, r);
    case "ventures":
      return noguera(estado, texto, nivel, r);
    case "ai":
      return elon(estado, texto, nivel, r);
    case "investments":
      return helena(estado, texto, nivel, r);
    case "foundries":
      return jeff(estado, texto, nivel, r);
    case "ocean":
      return vance(estado, texto, nivel, r);
    case "ilha":
      return isabella(estado, texto, nivel, r);
    default:
      return `${perfil.nome} aqui. ${fmtUSD(0)} — pode falar.`;
  }
}

/** Label legível do nível de relação. */
export function labelRelacao(valor: number): { label: string; cor: string } {
  if (valor >= 85) return { label: "Íntimo", cor: "text-rose-300" };
  if (valor >= 70) return { label: "Aliado", cor: "text-primary" };
  if (valor >= 50) return { label: "Neutro", cor: "text-foreground/70" };
  if (valor >= 30) return { label: "Tenso", cor: "text-amber-400" };
  if (valor >= 10) return { label: "Frio", cor: "text-slate-400" };
  return { label: "Hostil", cor: "text-destructive" };
}
