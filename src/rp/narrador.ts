import type { ConfigIA, EntradaFeed, EstadoRP } from "./types";
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
