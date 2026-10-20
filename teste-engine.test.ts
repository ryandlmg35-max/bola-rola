import { describe, expect, it } from "vitest";
import { estadoInicial } from "./src/rp/estadoInicial";
import { aplicar, fmtUSD, interpretar } from "./src/rp/engine";
import { buscarLore, loreLinhas } from "./src/rp/lore";

describe("engine do RP", () => {
  it("classifica ação e lê o valor em bilhões", () => {
    const gasto = interpretar("gastar 500 milhões na Ilha MR");
    expect(gasto.categoria).toBe("gasto");
    expect(gasto.valor).toBeCloseTo(0.5, 9);

    const inv = interpretar("investir 2 bi em fábrica na China");
    expect(inv.categoria).toBe("investimento");
    expect(inv.valor).toBeCloseTo(2, 9);
  });

  it("estado inicial batido com o fim da conversa", () => {
    const st = estadoInicial();
    expect(st.caixa).toBe(13.3);
    expect(st.pessoal).toBe(37.395);
    expect(st.coin).toBe(55);
    expect(st.feed[0].titulo).toBe("O Monitor Desligado");
    expect(st.pendencias).toHaveLength(7);
  });

  it("turno fecha com consequências consistentes", () => {
    const st = estadoInicial();
    const e = aplicar(st, "gastar 500 milhões na Ilha MR");
    expect(e.turno).toBe(1);
    expect(e.narradoPor).toBe("engine");
    expect(e.cena).toContain("Ilha MR");
    expect(e.efeitos.some((l) => l.startsWith("Caixa"))).toBe(true);
    // invariante: a linha de caixa reflete exatamente o delta da engine
    // (turno 1 pode incluir evento ambiente, por isso não se fixa valor bruto)
    const linhaCaixa = e.efeitos.find((l) => l.startsWith("Caixa da holding"));
    expect(linhaCaixa).toContain(fmtUSD(13.3));
    expect(linhaCaixa).toContain(fmtUSD(13.3 + (e.delta.caixa ?? 0)));
    expect(e.delta.caixa).toBeLessThanOrEqual(-0.5); // no mínimo o valor pedido
    expect(e.escolhas.length).toBeGreaterThanOrEqual(3);
    expect(e.reacoes.midia.length).toBeGreaterThan(0);
    expect(e.reacoes.povo.length).toBeGreaterThan(0);
  });

  it("pendência avança quando o texto bate no gatilho", () => {
    const st = estadoInicial();
    const e = aplicar(st, "liberar o gatilho da Apple agora");
    expect(e.efeitos.some((l) => l.includes("[Operação Maçã Podre"))).toBe(true);
  });

  it("é determinístico: mesmo entrada + mesmo turno = mesmo resultado", () => {
    const st = estadoInicial();
    const x = aplicar(st, "comprar 1 bi em ações");
    const y = aplicar(st, "comprar 1 bi em ações");
    expect(x.titulo).toBe(y.titulo);
    expect(x.efeitos).toEqual(y.efeitos);
    expect(x.cena).toBe(y.cena);
  });

  it("caixa nunca fica negativo — a Sofia cobre o buraco", () => {
    const st = { ...estadoInicial(), caixa: 0.05 };
    const e = aplicar(st, "gastar 100 milhões em festa");
    expect(e.efeitos.some((l) => l.includes("Caixa zerado"))).toBe(true);
  });

  it("heat/moral/aprovação ficam entre 0 e 100", () => {
    const st = { ...estadoInicial(), heat: 99 };
    const e = aplicar(st, "guerra total contra a Disney, atacar forte");
    const linhaHeat = e.efeitos.find((l) => l.startsWith("Heat"));
    expect(linhaHeat).toContain("→ 100/100"); // clamp real, não o delta bruto
    const stAlto = { ...estadoInicial(), heat: 0 };
    const e2 = aplicar(stAlto, "caridade total, doar tudo pros pobres");
    expect(e2.delta.heat ?? 0).toBeLessThan(0); // caridade puxa o heat pra baixo…
    for (const l of e2.efeitos) expect(l).not.toMatch(/: -\d+\/100/); // …mas nunca exibe negativo
  });
});

describe("memória oculta (roleplat.txt)", () => {
  it("tem as linhas todas do arquivo original", () => {
    expect(loreLinhas).toBeGreaterThan(27000);
  });

  it("busca por nome devolve trechos do arquivo", () => {
    const achados = buscarLore("INDEX T1 Faker contrato");
    expect(achados.length).toBeGreaterThan(0);
    expect(achados[0]).toContain("roleplat.txt:");
  });

  it("busca só de 'onde parou' puxa o trecho final", () => {
    const achados = buscarLore("monitor desligado Axiom 128 andar");
    expect(achados.length).toBeGreaterThan(0);
  });
});
