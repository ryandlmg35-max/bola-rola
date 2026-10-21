import type { ConfigIA } from "./types";
import { chamarIA, extrairJSON, type MensagemIA } from "./ia";
import { resumoExtrativo } from "./contexto";

/**
 * Raciocínio em duas fases: primeiro o modelo pondera (estado, presentes,
 * riscos, coerência), depois escreve a fala final. O plano interno nunca
 * aparece como fala — a UI mostra só "pensou por Xs" recolhível.
 */

export interface PlanoInterno {
  presentes: string[];
  riscos: string[];
  gancho: string;
  coerencia: string;
}

export interface RespostaComPlano {
  texto: string;
  /** Plano interno em texto (para o disclosure "pensou por Xs"). */
  pensamento: string | null;
  pensouMs: number;
}

const REGRAS_PLANEJADOR = `Você é o PLANEJADOR INTERNO do RP Space · Império MR. Não escreva a resposta final: analise e devolva SOMENTE JSON válido.
Formato exato:
{"presentes":["quem está na cena"],"riscos":["o que pode dar errado"],"gancho":"o próximo gancho dramático","coerencia":"o que precisa bater com o histórico"}

Regras:
- Máximo 3 itens em cada lista, cada item em até 15 palavras.
- Use nomes, números e fatos do ESTADO e da MEMÓRIA. Nada inventado.
- Considere o local atual, quem ouve, a relação com a Sofia e o que já foi dito.
- Não repita o pedido do Ryan; decida o que a resposta precisa entregar.
- O gancho é uma fala curta e concreta, nunca uma cena literária ou parágrafo sensorial.`;

/** Plano interno: barato, curto, temperatura baixa. Falha → null (segue sem). */
export async function planejarResposta(
  config: ConfigIA,
  modelo: string,
  contextoPronto: MensagemIA[],
  texto: string,
): Promise<{ plano: PlanoInterno | null; bruto: string; ms: number }> {
  if (!contextoPronto.length) return { plano: null, bruto: "", ms: 0 };
  const sistema = contextoPronto[0].content;
  const recentes = contextoPronto.slice(1);
  const mensagens: MensagemIA[] = [
    { role: "system", content: `${REGRAS_PLANEJADOR}\n\nCONTEXTO:\n${sistema}` },
    ...recentes.slice(-6),
    { role: "user", content: `ÚLTIMA FALA DO RYAN: ${texto}\n\nDevolva só o JSON do plano.` },
  ];
  const inicio = performance.now();
  const r = await chamarIA(config, modelo, mensagens, {
    temperature: 0.3,
    maxTokens: 240,
    timeoutMs: 30_000,
  });
  const ms = Math.round(performance.now() - inicio);
  if (!r.texto) return { plano: null, bruto: "", ms };
  const plano = extrairJSON<PlanoInterno>(r.texto);
  return { plano, bruto: r.texto.trim().slice(0, 900), ms };
}

/** Anexa o plano ao prompt do ator (não é fala — é direção). */
export function comPlanoNoPrompt(base: MensagemIA[], bruto: string): MensagemIA[] {
  if (!base.length || !bruto.trim()) return base;
  const [sistema, ...resto] = base;
  return [
    {
      role: "system",
      content: `${sistema.content}\n\n## PLANO INTERNO (siga a direção; não cite este bloco)\n${bruto.trim()}`,
    },
    ...resto,
  ];
}

/**
 * Resumo rolante por IA. Devolve null quando a IA falha — o chamador cai
 * no extrativo e a memória nunca deixa de avançar.
 */
export async function resumirConversaIA(
  config: ConfigIA,
  modelo: string,
  trecho: string,
): Promise<string | null> {
  const r = await chamarIA(
    config,
    modelo,
    [
      {
        role: "system",
        content: `Você condensa memória de roleplay. Resuma a conversa abaixo em 3 a 6 bullets, em português do Brasil.
Preserve: nomes citados, números, decisões tomadas, promessas, ameaças e mudanças de relação. Sem opinião, sem floreio.
Responda só os bullets.`,
      },
      { role: "user", content: trecho.slice(0, 6000) },
    ],
    { temperature: 0.4, maxTokens: 320, timeoutMs: 45_000 },
  );
  return r.texto ? r.texto.trim().slice(0, 1200) : null;
}

/** Fallback local determinístico (IA desligada/offline). */
export function resumirConversaLocal(trecho: string): string {
  return resumoExtrativo(trecho, 900);
}
