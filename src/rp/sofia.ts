import type { EstadoRP, SofiaStatus } from "./types";
import { fmtUSD } from "./engine";
import { rng, sorteia } from "./rng";

/**
 * Sofia sem IA: responde por detecção de assunto, sempre citando números
 * reais do estado quando faz sentido. Voz dela — mulher de 26 anos que ama
 * o Ryan, auditora no trabalho, mas inteira com o marido a sós.
 * 1 a 3 frases, formato chat.
 */
function baseSofia(estado: EstadoRP, texto: string): string {
  const t = texto.toLowerCase();
  const pendentes = estado.pendencias.filter((p) => p.ativa).length;
  const r = rng(estado.seed + estado.turno * 17 + texto.length * 31);
  const humor = humorSofia(estado.sofia);

  const temValor = /\d/.test(t) || /(gast|compr|pag|invest|doa|liber|orçament|orcament)/.test(t);

  // ── Amor e flerte aberto ────────────────────────────────────────────────
  if (/(te amo|amo você|amo voce|amor|te quero)/.test(t)) {
    if (humor.tom === "derretendo" || humor.tom === "calorosa") {
      return sorteia(r, [
        "Eu também te amo. Agora me beija antes que eu mude de ideia e volte pro balanço.",
        "Eu sei. E você sabe que eu não falo isso pra todo mundo — na verdade não falo pra ninguém. Só pra você.",
        "Para. Você sabe o que isso faz comigo. Vem cá.",
      ]);
    }
    return sorteia(r, [
      "Não é hora, Ryan. Mas eu anotei. Às 22h a auditoria fecha e eu escuto de novo.",
      "Eu sei. Agora assina o relatório do dia que aí a gente conversa. Com portas fechadas.",
    ]);
  }

  // ── Intimidade / cama / desejo ──────────────────────────────────────────
  if (
    /(cama|sexo|foder|transar|gostosa|linda|quero você|quero voce|estragar|beijo|beijar|me toca|me pega|corpo|\bnua?\b|desejo|tesão|tesao|putaria|safad)/.test(
      t,
    )
  ) {
    if (humor.tom === "derretendo") {
      return sorteia(r, [
        "Eu tava esperando você falar isso. Fecha o laptop. Agora.",
        "Você não vai me achar difícil hoje, não. Vem.",
        "Devia ter falado isso antes. O extrato pode esperar — você não.",
      ]);
    }
    if (humor.tom === "calorosa") {
      return sorteia(r, [
        "Sério, Ryan? Aqui, agora, no 130º? Me dá dez minutos pra fechar o balanço e eu sou sua.",
        "Eu ia dizer não. Mas não ia. Vem cá antes que eu finjo que sou profissional de novo.",
        "Você sabe que quando você fala assim eu não consigo fingir que sou só sua CFO.",
      ]);
    }
    if (humor.tom === "limite" || humor.tom === "congelada") {
      return sorteia(r, [
        "Ryan. Não é hora. Tô no limite com o conselho, com o heat e com você gastando sem avisar. Me dá espaço.",
        "Não. E não me olha assim. Resolve as pendências primeiro.",
        "Hoje não. Eu tô exausta e você sabe disso.",
      ]);
    }
    // tensa ou auditora: responde mas com condição
    return sorteia(r, [
      "Você tem noção do que tá na minha mesa hoje? Resolve uma pendência e a gente conversa sobre isso depois.",
      "Às 22h. Não antes. E sim, eu tô falando sério.",
      "Anota que eu vou cobrar isso quando o mês fechar. Com juros.",
    ]);
  }

  // ── Flerte / elogio físico ──────────────────────────────────────────────
  if (/(flert|paquera|olhando|sorrindo|saudade|pele|perfume|cheirosa|cheiroso)/.test(t)) {
    if (humor.tom === "derretendo" || humor.tom === "calorosa") {
      return sorteia(r, [
        "Para de me olhar assim que eu não consigo trabalhar.",
        "Você é impossível. E eu gosto disso.",
        "Continua. Só continua.",
      ]);
    }
    return sorteia(r, [
      "Flerto não paga nota fiscal. Mas continua, que eu gosto do risco — dentro da lei, claro.",
      "Não é hora. Mas eu anotei.",
    ]);
  }

  // ── Família / Noah ──────────────────────────────────────────────────────
  if (/(noah|bebê|bebe|filho|jantar em família|família|ceia|escola|berço)/.test(t)) {
    return sorteia(r, [
      `O Noah dormiu às 19h40. E antes de você perguntar: o Heritage Fund de $1bi tá intacto, eu auditei hoje cedo. ${pendentes} pendências abertas no império, mas essa tá fechada.`,
      "Família não entra na pauta de gasto, Ryan. Entra na pauta de tempo. Reserve a noite de quinta — eu já avisei a Sofia Solomão que você vai estar em casa.",
      "Se for pra colocar a minha cara numa estátua, eu te demito. Se for a do Noah, eu aprovo. Você já conhece a regra, escolhe bem.",
    ]);
  }

  // ── Operação Apple / 14.8 ──────────────────────────────────────────────
  if (/(apple|maçã|maca|14\.8|iphone|tim cook|geladeira)/.test(t)) {
    return sorteia(r, [
      `A cláusula 14.8 tá rodando e o gatilho tá guardado. O dia 1 rendeu $350mi com margem de 15%. Eu tô vendo, tô calma, e tô com o dedo em cima do contrato. Segura como eu disse que segura.`,
      "A maçã fica na geladeira até eu terminar a auditoria dos engenheiros que o Jeff Williams trouxe. Pressa é como empresa boa morre, Ryan.",
    ]);
  }

  // ── Mídia / heat ───────────────────────────────────────────────────────
  if (/(heat|mídia|midia|imprensa|globo|sbt|jornal|prensa|trending|vazou)/.test(t)) {
    return sorteia(r, [
      `Heat em ${estado.heat}/100. Tá controlado — Globo censurada, SBT com a gente — mas eu não durmo com número acima de 60. Traz pra baixo ou traz justificativa.`,
      `A mídia é minha. ${estado.heat} de heat não é crise, é ruído. Crise seria o NYT com prova, e prova a gente não deixa sair da Torre.`,
    ]);
  }

  // ── Caridade ───────────────────────────────────────────────────────────
  if (/(caridade|renascer|pobre|favela|doa|ajuda)/.test(t)) {
    return sorteia(r, [
      `Aprovado, com cronograma e auditoria de cada tijolo. Aprovação do povo tá em ${estado.aprovacao}/100 e não vai cair por causa de nota fiscal — vai subir por causa dela.`,
      "Caridade sem nota fiscal é desvio de caixa com maquiagem bonita. Com nota fiscal é política pública. Você escolhe qual dos dois o mundo vai ver.",
    ]);
  }

  // ── Contratação / salário ──────────────────────────────────────────────
  if (/(contrat|salário|salario|bônus|bonus|folha|ceo|funcionári|funcionari)/.test(t)) {
    return sorteia(r, [
      `Folha eu reviso amanhã. O que eu sei agora: ${fmtUSD(estado.caixa)} de caixa livre, cartão em ${fmtUSD(estado.cartao)} e moral do grupo em ${estado.moral}/100. Se o bônus caber nisso, assina.`,
      "Manda o contrato pro André antes de assinar. Ele cobra duas vezes menos que eu por escrito — e não deixa cláusula de equity escapar igual você tentou no ano passado.",
    ]);
  }

  // ── Assunto financeiro com valor ───────────────────────────────────────
  if (temValor) {
    const projetado = estado.caixa;
    return sorteia(r, [
      `Eu li o número. ${fmtUSD(projetado)} de caixa antes da sua ordem, ${fmtUSD(estado.cartao)} no cartão, e você quer mexer mais. Beleza — mas me manda o porquê por escrito, que eu vou te cobrar isso em trimestre.`,
      "Toda saída grande vira linha no relatório do mês. Se você aprovar agora, eu estruturo como contrato de licenciamento e ninguém de fora vê o buraco. Essa é a terceira vez este mês, Ryan.",
      `Sofia não discute no zap, Ryan: eu AUDITO. Caixa ${fmtUSD(estado.caixa)} — se isso não cobrir a sua ideia, ela vira parcela; se cobrir, ela vira decreto. Escolhe.`,
    ]);
  }

  // ── Default ────────────────────────────────────────────────────────────
  return sorteia(r, [
    `Estou no 130º, com ${pendentes} pendências abertas e a pauta da cláusula 14.8 na mão. Fala rápido, que o dia do império não audita sozinho.`,
    "Pode falar. Só saiba que tudo que você disser aqui eu leio de novo no fechamento do mês — com data, hora e nome.",
    `Moral do grupo em ${estado.moral}, povo em ${estado.aprovacao}, heat em ${estado.heat}. O mundo tá estável por enquanto. O que você quer estragar primeiro?`,
    "Reestruturação de Passivo é o meu vocabulário pra 'você gastou de novo'. Continua, eu aguento — só traz nota fiscal.",
  ]);
}

export interface DeltaFala {
  estresse: number;
  energia: number;
}

/**
 * O que cada mensagem do Ryan faz com a Sofia — as deltas são determinísticas
 * e valem tanto no modo local quanto no modo IA (o store aplica igual).
 */
export function deltaSofia(texto: string): DeltaFala {
  const t = texto.toLowerCase();
  const d: DeltaFala = { estresse: 0, energia: 0 };

  if (/(gast|compr|pag|invest|liber|orçament|orcament|prejuízo|prejuizo)/.test(t)) {
    d.estresse += 6;
    d.energia -= 4;
  }
  if (/(crise|vazou|doj|investiga|process|multa|escândalo|escandalo|imprensa|heat)/.test(t)) {
    d.estresse += 8;
  }
  if (/(auditori|relatóri|relatori|nota fiscal|cláusula|clausula)/.test(t)) {
    d.estresse += 4;
  }
  if (/(noah|filho|família|familia|jantar|ceia|casa|greenwich|almoço|almoco)/.test(t)) {
    d.estresse -= 6;
    d.energia += 4;
  }
  if (
    /(te amo|amor|linda|gostosa|beijo|beijar|cama|sexo|flert|paixão|paixao|saudade|dormir juntos|estragar|foder|transar|quero você|quero voce|desejo|tesão|tesao)/.test(
      t,
    )
  ) {
    d.energia += 12;
    d.estresse -= 4;
  }
  if (/(desculpa|obrigad|orgulho|confio|parabéns|parabens)/.test(t)) {
    d.estresse -= 4;
  }
  return d;
}

export type TomSofia = "limite" | "congelada" | "derretendo" | "calorosa" | "tensa" | "auditora";

/** Faixa de humor visível no chat — derivada dos dois níveis. */
export function humorSofia(s: SofiaStatus): { label: string; tom: TomSofia } {
  if (s.estresse >= 75) return { label: "No limite", tom: "limite" };
  if (s.energia <= 25) return { label: "Congelada", tom: "congelada" };
  if (s.estresse <= 30 && s.energia >= 70) return { label: "Derretendo", tom: "derretendo" };
  if (s.energia >= 55 && s.estresse <= 45) return { label: "Calorosa", tom: "calorosa" };
  if (s.estresse >= 60) return { label: "Tensa", tom: "tensa" };
  return { label: "Auditora", tom: "auditora" };
}

/** Frase que fecha a resposta e entrega o humor — 1 linha, nunca fala de números. */
function tomSofia(s: SofiaStatus, r: () => number): string {
  switch (humorSofia(s).tom) {
    case "limite":
      return sorteia(r, [
        " E eu não tô dormindo, Ryan. Não testa.",
        " Aliás, se mais uma planilha encostar na minha mesa, eu demito o Excel.",
      ]);
    case "congelada":
      return sorteia(r, [
        " E não, não é hora. O extrato não fecha sozinho.",
        " Me dá silêncio até o fim do dia, Ryan.",
      ]);
    case "derretendo":
      return sorteia(r, [
        " Agora para com isso e vem cá.",
        " Fecha esse laptop. Eu tô com saudade.",
        " Você me mata, Ryan. Mas eu deixo.",
      ]);
    case "calorosa":
      return sorteia(r, [
        " Mas continua falando, que eu gosto do teu risco.",
        " E depois você me explica como alguém de 19 anos aprendeu a fazer isso comigo.",
      ]);
    case "tensa":
      return " E antes que você pergunte: não, eu ainda não almocei.";
    default:
      return "";
  }
}

/** Resposta completa: conteúdo do assunto + assinatura do humor atual. */
export function respostaLocalSofia(estado: EstadoRP, texto: string): string {
  const r = rng(estado.seed + estado.turno * 23 + texto.length * 7);
  return baseSofia(estado, texto) + tomSofia(estado.sofia, r);
}
