/**
 * Bíblia do mundo — carregada de `/biblia-do-mundo.md` (editável sem build).
 * Override opcional salvo em localStorage pelo editor em Ajustes; tem
 * precedência sobre o arquivo. O prompt sempre recebe uma versão capada.
 */

const URL_BIBLIA = "/biblia-do-mundo.md";
const CHAVE_OVERRIDE = "space-mr-biblia-v1";
/** Teto do texto da bíblia no prompt — evita inflar custo com apêndices. */
export const LIMITE_BIBLIA_PROMPT = 7000;

let cacheArquivo: string | null = null;
let carregando: Promise<string> | null = null;

function lerLocal(chave: string): string | null {
  try {
    return localStorage.getItem(chave);
  } catch {
    return null;
  }
}

function gravarLocal(chave: string, valor: string | null): void {
  try {
    if (valor === null) localStorage.removeItem(chave);
    else localStorage.setItem(chave, valor);
  } catch {
    /* modo privado/storage cheio: a bíblia do arquivo continua valendo */
  }
}

/** Override do usuário (editor de Ajustes), ou null se não houver. */
export function bibliaOverride(): string | null {
  const t = lerLocal(CHAVE_OVERRIDE);
  return t && t.trim() ? t : null;
}

export function salvarBibliaOverride(texto: string | null): void {
  const limpo = texto === null ? null : texto.trim() ? texto : null;
  gravarLocal(CHAVE_OVERRIDE, limpo);
}

/** Arquivo publicado (sem override). Útil pro editor mostrar a fonte. */
export async function bibliaDoArquivo(): Promise<string> {
  if (cacheArquivo !== null) return cacheArquivo;
  if (!carregando) {
    carregando = fetch(URL_BIBLIA)
      .then((r) => (r.ok ? r.text() : ""))
      .then((t) => {
        cacheArquivo = t;
        return t;
      })
      .catch(() => {
        cacheArquivo = "";
        return "";
      })
      .finally(() => {
        carregando = null;
      });
  }
  return carregando;
}

/**
 * Bíblia efetiva: override do usuário > arquivo > string vazia.
 * Nunca lança — o chat funciona mesmo sem o arquivo (basta o estado + lore).
 */
export async function carregarBiblia(): Promise<string> {
  const override = bibliaOverride();
  if (override) return override.slice(0, LIMITE_BIBLIA_PROMPT);
  const arquivo = await bibliaDoArquivo();
  return arquivo.slice(0, LIMITE_BIBLIA_PROMPT);
}

/** Síncrona: só o que já está em memória (testes e fallback). */
export function bibliaEmCache(): string {
  return (bibliaOverride() ?? cacheArquivo ?? "").slice(0, LIMITE_BIBLIA_PROMPT);
}
