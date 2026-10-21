import { describe, expect, it } from "vitest";
import { MODO_PESSOA_COMUM, enxugarFala, estiloNoContexto } from "./src/rp/estilo";

describe("estilo de gente no chat", () => {
  it("tira ação em asteriscos, aspas e parágrafos", () => {
    const r = enxugarFala('*sorri de canto* "vem cá.\n\nSenta comigo."');
    expect(r).toBe("vem cá. Senta comigo.");
  });

  it("remove aspas internas — chat não é citação", () => {
    expect(enxugarFala('ele disse "vem" e saiu')).toBe("ele disse vem e saiu");
  });

  it("não mexe em fala curta", () => {
    expect(enxugarFala("tô na varanda. vem.")).toBe("tô na varanda. vem.");
  });

  it("corta no fim de frase antes do teto", () => {
    const r = enxugarFala(
      "Primeira frase inteira. Segunda frase que também fecha. Terceira frase que já passa do limite e continua falando sem parar por muito tempo.",
      80,
    );
    expect(r.length).toBeLessThanOrEqual(81);
    expect(r).toMatch(/\.$/);
  });

  it("corta na palavra inteira quando não tem pontuação", () => {
    const r = enxugarFala("palavra ".repeat(60), 60);
    expect(r.length).toBeLessThanOrEqual(61);
    expect(r).not.toMatch(/palav…$/);
  });

  it("injeta o modo pessoa comum no fim do system", () => {
    const msgs = estiloNoContexto([
      { role: "system", content: "PERSONA" },
      { role: "user", content: "oi" },
    ]);
    expect(msgs[0].content).toContain("PERSONA");
    expect(msgs[0].content.endsWith(MODO_PESSOA_COMUM)).toBe(true);
    expect(msgs[0].content).toContain("PROIBIDO tom de atendente");
    expect(msgs[0].content).toContain("já vou");
    expect(msgs[1].content).toBe("oi");
  });
});
