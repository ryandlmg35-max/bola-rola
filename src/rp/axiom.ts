import type { EstadoRP } from "./types";
import { fmtUSD } from "./engine";
import { resumoMensal } from "./mundo";
import { rng, sorteia } from "./rng";

/**
 * Axiom sem IA: responde por assunto, sempre com número real do estado.
 * Voz: ex-monge da favela, ex-GIGN, braço direito do Ryan desde 2019.
 * "Boss man", frase curta, lealdade absoluta, humor seco.
 */
export function respostaLocalAxiom(estado: EstadoRP, texto: string): string {
  const t = texto.toLowerCase();
  const r = rng((estado.seed ^ (estado.turno * 2654435761) ^ texto.length) >>> 0);
  const resumo = resumoMensal(estado);
  const conflito = estado.mundo.conflitos[0];
  const pendencias = estado.pendencias.filter((p) => p.ativa);
  const ultimoEvento = estado.feed[0]?.titulo ?? estado.mundo.ultimaSemana[0] ?? null;
  const divisaoCitada = estado.divisoes.find((d) =>
    t.includes(d.nome.toLowerCase().split(" ")[1]?.toLowerCase() ?? "###"),
  );

  // intenções conversacionais — responder AO QUE ELE DISSE, não soltar relatório
  if (
    /(bom dia|boa tarde|boa noite|bom dia,|oi[,! ]|olá|ola[,! ]|fala aí|fala ai|^e aí|^e ai|e ai,|tudo bem|tudo bom)/.test(
      t,
    )
  ) {
    const saudacao = /boa noite/.test(t)
      ? "Boa noite"
      : /boa tarde/.test(t)
        ? "Boa tarde"
        : "Bom dia";
    return sorteia(r, [
      `${saudacao}, boss man. Conselho a ${estado.mundo.tensao}/100, ${estado.mundo.clima.toLowerCase()}. Café preto ou já parte pro primeiro movimento?`,
      `${saudacao}. Tudo no lugar: caixa em ${fmtUSD(estado.caixa)}, ${pendencias.length} pendência(s) na minha mesa. O dia é seu.`,
    ]);
  }

  if (
    /(voo|voar|viajar|viagem|malas|passagem|jato|brasil|brasília|brasilia|partir|embarcar)/.test(t)
  ) {
    const de = estado.localizacao === "casa" ? "a casa" : "a torre";
    return sorteia(r, [
      `Jato tá em ${de}, pronto. Me diz o destino e a hora que eu aciono a tripulação e travo sua agenda — o mapa de rotas tá aberto no Painel.`,
      `Pode ir, boss man: ${de} pro aeroporto são 25 min com o combo escolta. Quer que eu alinhe sua agenda antes? A Sofia vai querer saber.`,
    ]);
  }

  if (/(obrigad|valeu|brigad)/.test(t)) {
    return sorteia(r, [
      "Sempre, boss man. É pra isso que eu existo.",
      "Tamo junto. Pode dormir tranquilo que a torre fica comigo.",
    ]);
  }

  if (
    /(quem é você|quem e voce|quem te criou|quem te programou|quem te mandou|você é real|voce é real|você é humano|voce é humano)/.test(
      t,
    )
  ) {
    return "Sou o Axiom. Desde 2019 com você, boss man — antes da Space Group ter nome. O resto é história que a gente ainda vai escrever.";
  }

  if (/(plano|diretriz|próximo|proximo|semana)/.test(t)) {
    return `Plano deste mês: ${estado.plano.diretriz}. Receita ×${estado.plano.receitaMult.toFixed(2)}, lucro ×${estado.plano.lucroMult.toFixed(2)}. Semana ${estado.calendario.semana}/4. Eu tenho três nomes no bolso e três ideias na cabeça. Só diz o nome.`;
  }

  if (/(conflito|briga|treta|atrito|conselho rachado)/.test(t)) {
    if (!conflito) {
      return "Nenhum conflito aberto, boss man. Conselho limpo é conselho que tá escondendo coisa — eu prefiro quando eles brigam na minha frente.";
    }
    return `Tem ${estado.mundo.conflitos.length} atrito(s) aberto(s). O principal é ${conflito.entre} contra ${conflito.sobre}, nível ${conflito.nivel}. Tensão geral em ${estado.mundo.tensao}/100. Se passar de 70, eu chamo todo mundo pra sala e desligo o ar-condicionado até assinarem paz.`;
  }

  if (/(mês|mes|fechamento|conselho|reunião|reuniao)/.test(t)) {
    return sorteia(r, [
      `Boss man, o mês fecha em ${fmtUSD(resumo.receita)} de receita e ${fmtUSD(resumo.lucro)} de lucro. O caixa hoje é ${fmtUSD(estado.caixa)}. Eu já subi os 12 CEOs pro 130º — só falta você escolher a diretriz e eu executo antes do café esfriar.`,
      `Conselho em ${estado.mundo.tensao}/100 de tensão. ${conflito ? `${conflito.entre} e ${conflito.sobre} ainda estão na mesa.` : "Ninguém brigou essa semana, o que me deixa desconfiado."} Fechamento batido: ${fmtUSD(resumo.lucro)} de lucro.`,
    ]);
  }

  if (/(dinheiro|caixa|gast|compr|invest|orçamento|orcamento)/.test(t)) {
    return sorteia(r, [
      `Caixa da holding: ${fmtUSD(estado.caixa)}. Cartão: ${fmtUSD(estado.cartao)} livres. A Sofia já leu teu extrato três vezes hoje. Se tu quer gastar, gasta — mas eu não vou ser o cara que assina embaixo.`,
      `A gente tem ${fmtUSD(estado.caixa)} em caixa e ${fmtUSD(estado.holding)} de valor de grupo. Dá pra comprar quase qualquer coisa. A pergunta não é "quanto custa", boss man — é "quanto custa depois".`,
    ]);
  }

  if (divisaoCitada) {
    return `${divisaoCitada.nome}: ${divisaoCitada.receita} de receita mês, ${divisaoCitada.lucro} de lucro, status ${divisaoCitada.status}. ${divisaoCitada.nota}. Quer que eu marque reunião com ${divisaoCitada.ceo === "-" ? "quem responde por ela" : divisaoCitada.ceo}?`;
  }

  if (/(sofia|noah|família|familia|casamento|filho)/.test(t)) {
    return `Sofia tá em ${estado.sofia.estresse}/100 de estresse e ${estado.sofia.energia}/100 de energia. Eu não me meto nisso, boss man — mas se ela perguntar, eu falo que você tava trabalhando. Noah tá bem. Já tem mais patrimônio que 99,9% do planeta.`;
  }

  if (/(concorr|apex|apple|disney|mercado|rival)/.test(t)) {
    return `Enquanto a gente conversa, a Apex abre fábrica e a Apple contrata os nossos engenheiros. Heat em ${estado.heat}/100, aprovação em ${estado.aprovacao}/100. Não é hora de reagir — é hora de comprar o fornecedor deles.`;
  }

  return sorteia(r, [
    `Boss man, eu tô lendo o feed. ${ultimoEvento ? `"${ultimoEvento}" — isso não foi acidente.` : "O mundo andou."} Caixa em ${fmtUSD(estado.caixa)}, ${pendencias.length} pendências abertas. Me dá o próximo movimento.`,
    `Tô de olho. ${ultimoEvento ? `Depois de "${ultimoEvento}", o conselho ficou quieto demais.` : `Semana ${estado.calendario.semana} de 4.`} Quieto demais pra mim — se não chamarem, eu apareço.`,
    `${ultimoEvento ? `"${ultimoEvento}" chegou antes da imprensa.` : `Semana ${estado.calendario.semana}/4.`} Nada que não se resolva com dinheiro, tempo ou uma demissão bem escolhida. ${fmtUSD(estado.caixa)} de caixa pra qualquer um dos três.`,
  ]);
}
