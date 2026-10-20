import type { EstadoRP } from "./types";
import { fmtUSD } from "./engine";
import { rng, sorteia } from "./rng";

/**
 * Sofia sem IA: responde por detecção de assunto, sempre citando números
 * reais do estado (caixa, cartão, heat, moral). Voz dela — auditora fria,
 * "nota fiscal", "Reestruturação de Passivo" — 1 a 3 frases, formato chat.
 */
export function respostaLocalSofia(estado: EstadoRP, texto: string): string {
  const t = texto.toLowerCase();
  const pendentes = estado.pendencias.filter((p) => p.ativa).length;
  const r = rng(estado.seed + estado.turno * 17 + texto.length * 31);

  const temValor = /\d/.test(t) || /(gast|compr|pag|invest|doa|liber|orçament|orcament)/.test(t);

  if (/(te amo|amo você|gostosa|linda|amor|casamento|beijar|cama)/.test(t)) {
    return sorteia(r, [
      "Não é hora, Ryan. Mas eu anotei. Às 22h a auditoria fecha e eu escuto de novo.",
      "Eu sei. Agora assina o relatório do dia que aí a gente conversa. Com portas fechadas.",
      "Flerto não paga nota fiscal. Mas continua, que eu gosto do risco — dentro da lei, claro.",
    ]);
  }

  if (/(noah|bebê|bebe|filho|jantar em família|família|ceia|escola|berço)/.test(t)) {
    return sorteia(r, [
      `O Noah dormiu às 19h40. E antes de você perguntar: o Heritage Fund de $1bi tá intacto, eu auditei hoje cedo. ${pendentes} pendências abertas no império, mas essa tá fechada.`,
      "Família não entra na pauta de gasto, Ryan. Entra na pauta de tempo. Reserve a noite de quinta — eu já avisei a Sofia Solomão que você vai estar em casa.",
      "Se for pra colocar a minha cara numa estátua, eu te demito. Se for a do Noah, eu aprovo. Você já conhece a regra, escolhe bem.",
    ]);
  }

  if (/(apple|maçã|maca|14\.8|iphone|tim cook|geladeira)/.test(t)) {
    return sorteia(r, [
      `A cláusula 14.8 tá rodando e o gatilho tá guardado. O dia 1 rendeu $350mi com margem de 15%. Eu tô vendo, tô calma, e tô com o dedo em cima do contrato. Segura como eu disse que segura.`,
      "A maçã fica na geladeira até eu terminar a auditoria dos engenheiros que o Jeff Williams trouxe. Pressa é como empresa boa morre, Ryan.",
    ]);
  }

  if (/(heat|mídia|midia|imprensa|globo|sbt|jornal|prensa|trending|vazou)/.test(t)) {
    return sorteia(r, [
      `Heat em ${estado.heat}/100. Tá controlado — Globo censurada, SBT com a gente — mas eu não durmo com número acima de 60. Traz pra baixo ou traz justificativa.`,
      `A mídia é minha. ${estado.heat} de heat não é crise, é ruído. Crise seria o NYT com prova, e prova a gente não deixa sair da Torre.`,
    ]);
  }

  if (/(caridade|renascer|casa|pobre|favela|doa|ajuda)/.test(t)) {
    return sorteia(r, [
      `Aprovado, com cronograma e auditoria de cada tijolo. Aprovação do povo tá em ${estado.aprovacao}/100 e não vai cair por causa de nota fiscal — vai subir por causa dela.`,
      "Caridade sem nota fiscal é desvio de caixa com maquiagem bonita. Com nota fiscal é política pública. Você escolhe qual dos dois o mundo vai ver.",
    ]);
  }

  if (/(contrat|salário|salario|bônus|bonus|folha|ceo|funcionári|funcionari)/.test(t)) {
    return sorteia(r, [
      `Folha eu reviso amanhã. O que eu sei agora: ${fmtUSD(estado.caixa)} de caixa livre, cartão em ${fmtUSD(estado.cartao)} e moral do grupo em ${estado.moral}/100. Se o bônus caber nisso, assina.`,
      "Manda o contrato pro André antes de assinar. Ele cobra duas vezes menos que eu por escrito — e não deixa cláusula de equity escapar igual você tentou no ano passado.",
    ]);
  }

  if (temValor) {
    const projetado = estado.caixa;
    return sorteia(r, [
      `Eu li o número. ${fmtUSD(projetado)} de caixa antes da sua ordem, ${fmtUSD(estado.cartao)} no cartão, e você quer mexer mais. Beleza — mas me manda o porquê por escrito, que eu vou te cobrar isso em trimestre.`,
      "Toda saída grande vira linha no relatório do mês. Se você aprovar agora, eu estruturo como contrato de licenciamento e ninguém de fora vê o buraco. Essa é a terceira vez este mês, Ryan.",
      `Sofia não discute no zap, Ryan: eu AUDITO. Caixa ${fmtUSD(estado.caixa)} — se isso não cobrir a sua ideia, ela vira parcela; se cobrir, ela vira decreto. Escolhe.`,
    ]);
  }

  return sorteia(r, [
    `Estou no 130º, com ${pendentes} pendências abertas e a pauta da cláusula 14.8 na mão. Fala rápido, que o dia do império não audita sozinho.`,
    "Pode falar. Só saiba que tudo que você dislar aqui eu leio de novo no fechamento do mês — com data, hora e nome.",
    `Moral do grupo em ${estado.moral}, povo em ${estado.aprovacao}, heat em ${estado.heat}. O mundo tá estável por enquanto. O que você quer estragar primeiro?`,
    "Reestruturação de Passivo é o meu vocabulário pra 'você gastou de novo'. Continua, eu aguento — só traz nota fiscal.",
  ]);
}
