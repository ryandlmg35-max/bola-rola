/** mulberry32 — RNG determinístico por turno; mesma ação + mesmo turno = mesmo resultado. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function sorteia<T>(r: () => number, itens: readonly T[]): T {
  return itens[Math.floor(r() * itens.length)] as T;
}

export function faixa(r: () => number, min: number, max: number): number {
  return min + r() * (max - min);
}
