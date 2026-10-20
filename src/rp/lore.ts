import textoCompleto from "@/lore/roleplat.txt?raw";

/**
 * Memória oculta do roleplay inteiro (27.728 linhas).
 * Nunca é renderizada na UI — serve só de contexto pra IA narradora.
 */
export const lore = textoCompleto;
export const loreLinhas = textoCompleto.split("\n").length;

interface Bloco {
  inicio: number;
  texto: string;
  termos: Set<string>;
}

let blocos: Bloco[] | null = null;

const TAM_BLOCO = 60; // linhas por bloco (~4KB)

function indexar(): Bloco[] {
  if (blocos) return blocos;
  const linhas = textoCompleto.split("\n");
  const fatias: Bloco[] = [];
  for (let i = 0; i < linhas.length; i += TAM_BLOCO) {
    const texto = linhas.slice(i, i + TAM_BLOCO).join("\n");
    const termos = new Set(
      texto
        .toLowerCase()
        .split(/[^\p{L}\p{N}$]+/u)
        .filter((w) => w.length > 3),
    );
    fatias.push({ inicio: i + 1, texto, termos });
  }
  blocos = fatias;
  return blocos;
}

/**
 * Busca lexical no roleplat inteiro e devolve os blocos mais relevantes
 * pra montar o contexto da IA. Só é chamado quando a narrativa por IA
 * está ligada — custo ~ms.
 */
export function buscarLore(consulta: string, maxBlocos = 3): string[] {
  const idx = indexar();
  const limiteFinal = Math.floor(idx.length * 0.75);
  const termos = consulta
    .toLowerCase()
    .split(/[^\p{L}\p{N}$]+/u)
    .filter((w) => w.length > 3);

  const pontuados = idx.map((b) => {
    let score = 0;
    for (const t of termos) if (b.termos.has(t)) score += 1;
    // blocos finais pesam mais: é onde o RP parou
    if (b.inicio >= limiteFinal) score += 0.15;
    return { b, score };
  });

  pontuados.sort((a, c) => c.score - a.score);
  return pontuados
    .slice(0, maxBlocos)
    .sort((a, c) => a.b.inicio - c.b.inicio)
    .map((x) => `... (roleplat.txt:${x.b.inicio}) ${x.b.texto.slice(0, 1200)}`);
}
