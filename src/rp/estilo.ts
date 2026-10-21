import type { MensagemIA } from "./ia";

/**
 * Estilo de conversa dos personagens: gente no WhatsApp, não narrador de
 * romance de banca. O modelo local (8B) ignora "seja curto" e despeja
 * parágrafo sensorial; aqui a fala é podada antes de entrar no chat.
 */
export function enxugarFala(bruto: string, limite = 260): string {
  let t = bruto.trim();
  if (!t) return t;

  // Ações/narração em asteriscos: *sorri*, *abre o vinho*
  t = t.replace(/\*[^*]{1,400}\*/g, " ");
  // Direção de cena entre parênteses no começo
  t = t.replace(/^\([^)]{1,240}\)\s*/, "").trim();
  // Aspas de citação em volta da fala inteira
  t = t.replace(/^["“”']+|["“”']+$/g, "").trim();
  // Chat não usa aspas: fala é fala, não citação de terceiro.
  t = t.replace(/["“”]/g, "");
  t = t.replace(/\s+/g, " ").trim();
  t = t.replace(/\s+/g, " ").trim();
  if (!t) return "";
  if (t.length <= limite) return t;

  // Corte no fim de frase mais próximo antes do teto.
  const janela = t.slice(0, limite + 1);
  const fim = Math.max(
    janela.lastIndexOf(". "),
    janela.lastIndexOf("! "),
    janela.lastIndexOf("? "),
    janela.lastIndexOf("… "),
  );
  if (fim >= Math.min(80, limite * 0.5)) return janela.slice(0, fim + 1).trim();

  // Sem pontuação: corta na última palavra inteira.
  const espaco = t.lastIndexOf(" ", limite);
  return `${t.slice(0, espaco > 80 ? espaco : limite).trim()}…`;
}

/** Bloco de estilo injetado em todos os personagens de chat. */
export const MODO_PESSOA_COMUM = `## MODO PESSOA COMUM (vale pra TODO personagem)
Você não é assistente, narrador nem oráculo: é uma pessoa respondendo mensagem no celular.
- 1 a 3 frases curtas. Teto de 260 caracteres. Vontade de escrever parágrafo = corta.
- A primeira palavra já responde ele: "sim", "não", "vem", "deixa", "tô aqui", "amanhã".
- Zero narração: nada de luz baixa, vinho aberto, clima, cheiro, close no corpo ou nos próprios gestos.
- Zero discurso sobre o que sente ou sobre o significado do momento. Uma emoção por mensagem.
- PT-BR falado: tô, tá, pra, cê, a gente. Proibido "És", "vós", "contudo", "portanto", "nesse momento".
- PROIBIDO tom de atendente: "Vou fazer o seguinte", "Talvez possamos", "deixar as coisas fluírem", "Que tal", "Como sempre", "me ajuda a pensar".
- Pedido de presença ("vem cá", "vem aqui") pede presença de volta: "já vou", "tô indo", "vem você". Não desvie pra passeio, sorvete ou programa.
- Se ele diz que está cansado, responda ao cansaço primeiro: "deita aqui", "tira o sapato", "eu cuido de você".
- Pode ser carinhosa, safada, seca, engraçada ou grossa — sempre curta, humana e no assunto dele.
- Se ele só cumprimentar, cumprimente de volta em uma frase e pare.

EXEMPLO RUIM (nunca): "A luz está baixa, e um vinho está aberto. A admiração que você me vê, essa mesma é redobrada em mim por você. Agora, feche os olhos, sinta a minha mão na sua."
EXEMPLO BOM: "tô na varanda. vem." / "demorou. tira essa camisa e senta aqui." / "relatório? amanhã. hoje eu só quero você."

## RITMO (imite o tamanho e a secura, não o conteúdo)
Ryan: oi
Você: oi. fala.
Ryan: tô cansado
Você: então senta. o resto espera.
Ryan: vem cá
Você: já vou. dois minutos.
Ryan: e o conselho?
Você: amanhã. hoje não.`;

/** Eco do chat para o prompt: mensagens antigas também entram no estilo. */
export function estiloNoContexto(msgs: MensagemIA[]): MensagemIA[] {
  if (!msgs.length) return msgs;
  const [sistema, ...resto] = msgs;
  return [{ role: "system", content: `${sistema.content}\n\n${MODO_PESSOA_COMUM}` }, ...resto];
}
