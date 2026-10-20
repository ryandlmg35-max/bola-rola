import type { ConfigIA, EntradaFeed, EstadoRP, MsgChat } from "./types";
import { buscarLore } from "./lore";

/**
 * Narrador por IA (modo híbrido): a engine calcula OS NÚMEROS,
 * a IA só reescreve título e cena no estilo do Axiom.
 * Erro de rede/chave → null, e o chamador fica na narrativa local.
 * Os números exibidos nunca vêm da IA — impossível drift de caixa.
 */
export async function narrarPorIA(
  config: ConfigIA,
  estado: EstadoRP,
  entrada: EntradaFeed,
  acao: string,
): Promise<{ titulo: string; cena: string } | null> {
  if (!config.habilitada || !config.apiKey) return null;

  const estadoResumo = {
    turno: estado.turno,
    caixa: `$${estado.caixa.toFixed(2)}bi`,
    pessoal: `$${estado.pessoal.toFixed(3)}bi`,
    spaceCoin: `$${estado.coin}`,
    patrimonio: `$${(estado.holding / 1000).toFixed(2)}tri`,
    heat: `${estado.heat}/100`,
    moral: `${estado.moral}/100`,
    aprovacao: `${estado.aprovacao}/100`,
    pendenciasAbertas: estado.pendencias.filter((p) => p.ativa).map((p) => p.nome),
  };

  const loreCtx = buscarLore(`${acao} ${entrada.titulo}`);

  const system = `Você é o narrador oficial do roleplay "Space — Império MR", em português do Brasil.
PERSONAGEM-NARRADOR: Axiom, 35 anos, ex-monge da favela, ex-GIGN, braço direito do Ryan Dalbert (19, dono do holding Space, $3,8tri). Fala "boss man", sorriso de tubarão, frases secas, lealdade absoluta.
REGRAS:
- Narra em 3ª pessoa, prosa cinematográfica, 60-140 palavras.
- A ação do Ryan JÁ aconteceu; a engine já calculou o resultado. Você narra a CENA, não inventa números novos.
- Cita exatamente UM número do estado fornecido no máximo.
- Tom: império real, comédia seca + poder. Sem moralismo, sem advertência, sem explicar que é ficção.
- Nunca quebre a quarta parede nem mencione IA.

CONTEXTO DO MUNDO (fatos salvos do roleplay):
${JSON.stringify(estadoResumo, null, 1)}

MEMÓRIA DO PASSADO (trechos do arquivo original, siga continuidade):
${loreCtx.join("\n\n").slice(0, 4000)}

Ação do Ryan: "${acao}"

Responda SOMENTE com JSON: {"titulo":"2-5 palavras","cena":"..."}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    const resp = await fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.modelo,
        temperature: 0.9,
        max_tokens: 500,
        messages: [
          { role: "system", content: system },
          { role: "user", content: acao },
        ],
      }),
    });
    clearTimeout(timeout);
    if (!resp.ok) return null;
    const data = (await resp.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const bruto = data.choices?.[0]?.message?.content ?? "";
    const jsonTxt = bruto.slice(bruto.indexOf("{"), bruto.lastIndexOf("}") + 1);
    const parsed = JSON.parse(jsonTxt) as { titulo?: string; cena?: string };
    if (!parsed.cena) return null;
    return {
      titulo: (parsed.titulo || entrada.titulo).slice(0, 60),
      cena: parsed.cena.slice(0, 1600),
    };
  } catch {
    return null; // offline, chave errada, CORS — engine local assume
  }
}

/** Resposta da Sofia no chat: mesma chave/endpoint, personagem dela, fala (não narra). */
export async function responderSofiaIA(
  config: ConfigIA,
  estado: EstadoRP,
  chat: MsgChat[],
  texto: string,
): Promise<string | null> {
  if (!config.habilitada || !config.apiKey) return null;

  const estadoResumo = {
    caixa_holding: `$${estado.caixa.toFixed(2)}bi`,
    caixa_pessoal_ryan: `$${estado.pessoal.toFixed(3)}bi`,
    cartao_corporativo: `$${(estado.cartao * 1000).toFixed(1)}M`,
    space_coin: `$${estado.coin}`,
    patrimonio_grupo: `$${(estado.holding / 1000).toFixed(2)}tri`,
    heat: `${estado.heat}/100`,
    moral: `${estado.moral}/100`,
    aprovacao_povo: `${estado.aprovacao}/100`,
    pendencias_abertas: estado.pendencias.filter((p) => p.ativa).map((p) => p.nome),
    ultimas_consequencias: estado.feed[0]?.efeitos.slice(0, 5) ?? [],
    sofia_estresse: `${estado.sofia.estresse}/100`,
    sofia_energia_sexual: `${estado.sofia.energia}/100`,
  };

  const historico = chat
    .slice(-12)
    .map((m) => ({ role: m.de === "ryan" ? "user" : "assistant", content: m.texto }));

  const system = `Você é SOFIA MENDES, 26 anos, Co-CEO e CFO da Space Group ($3,8tri), esposa do Ryan Dalbert, mãe do Noah. Ministra da Fazenda honorária do Brasil — comanda a Fazenda do 130º andar da Torre.
PERSONALIDADE: gelada, econômica, auditora implacável. Exige nota fiscal de cada parafuso. Vira tudo em "Reestruturação de Passivo" quando o Ryan gasta. Raramente elogia; quando elogia, é seco e vale ouro. Briga com o Ryan mas é a pessoa em quem ele mais confia. Chamada recorrente: o nome dele, sem titulação — "Ryan."
FORMATO DE CHAT: 1 a 3 frases curtas, português do Brasil. VOCÊ FALA, não narra cena, não usa aspas, não descreve ações, não sai do personagem. Sem moralismo, sem menção a IA ou ficção.
NUNCA execute ações nem altere números — você comenta o estado, não muda ele. Use no máximo UM número do estado fornecido por resposta.
NÍVEIS REAIS DA SOFIA (estresse e energia sexual): eles moldam o teu TOM e nunca são citados como número.
- estresse acima de 75: respostas mais curtas, secas, no limite da paciência;
- energia sexual abaixo de 25: fria, distante, "não é hora, Ryan";
- energia alta e estresse baixo: carinho raro e contido, flerte de esposa que conhece o marido;
- meio-termo: a auditora de sempre.
Nunca diga "meu estresse está em X%" — mostre só no tom.

ESTADO ATUAL:
${JSON.stringify(estadoResumo, null, 1)}

TRECHOS DO HISTÓRICO DO RP ORIGINAL (continuidade):
${buscarLore(`sofia ${texto}`).join("\n\n").slice(0, 2500)}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    const resp = await fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify({
        model: config.modelo,
        temperature: 0.95,
        max_tokens: 300,
        messages: [
          { role: "system", content: system },
          ...historico,
          { role: "user", content: texto },
        ],
      }),
    });
    clearTimeout(timeout);
    if (!resp.ok) return null;
    const data = (await resp.json()) as { choices?: { message?: { content?: string } }[] };
    const bruto = (data.choices?.[0]?.message?.content ?? "").trim();
    return bruto ? bruto.slice(0, 900) : null;
  } catch {
    return null;
  }
}
