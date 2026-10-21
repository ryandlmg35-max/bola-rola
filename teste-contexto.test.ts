import { describe, expect, it } from "vitest";
import { estadoInicial } from "./src/rp/estadoInicial";
import { configInicial } from "./src/rp/ia";
import { PRESETS_PROVEDOR, aplicarPresetProvedor } from "./src/rp/ia";
import {
  LIMITE_HISTORICO,
  historicoParaIA,
  juntarResumo,
  mensagensNovasParaResumo,
  montarContexto,
  resumoEstadoParaIA,
  resumoExtrativo,
} from "./src/rp/contexto";

describe("contexto em camadas", () => {
  const estado = estadoInicial();
  const persona = "PERSONA TESTE — você é o Axiom.";
  const biblia = "BÍBLIA TESTE: Sofia é CFO e esposa do Ryan.";
  const texto = "bom dia";

  it("monta o sistema com persona, bíblia, estado, memória e regras", () => {
    const msgs = montarContexto({
      estado,
      persona,
      texto,
      biblia,
      historico: [
        { role: "user", content: "oi" },
        { role: "assistant", content: "olá" },
      ],
      memoria: { resumo: "Ryan prometeu um jato.", marcas: 10 },
    });
    expect(msgs[0].role).toBe("system");
    const sistema = msgs[0].content;
    expect(sistema).toContain(persona);
    expect(sistema).toContain(biblia);
    expect(sistema).toContain("## ESTADO ATUAL DO JOGO (JSON)");
    expect(sistema).toContain("caixa_holding_bi");
    expect(sistema).toContain("Ryan prometeu um jato.");
    expect(sistema).toContain("## REGRAS DE RESPOSTA");
    expect(msgs[msgs.length - 1]).toEqual({ role: "user", content: texto });
  });

  it("estado JSON carrega os números canônicos e o local atual", () => {
    const r = resumoEstadoParaIA({ ...estado, localizacao: "casa" });
    expect(r.caixa_holding_bi).toBeCloseTo(13.3, 3);
    expect(r.bolso_ryan_bi).toBeCloseTo(37.395, 3);
    expect(r.space_coin_usd).toBe(55);
    expect(r.semana_do_mes).toBe("1/4");
    expect(r.local).toContain("Greenwich");
    expect(r.pendencias_abertas.length).toBeGreaterThanOrEqual(7);
  });

  it("histórico mapeia Ryan como user e personagem como assistant", () => {
    const h = historicoParaIA([
      { de: "ryan", texto: "e aí" },
      { de: "sofia", texto: "oi" },
    ]);
    expect(h).toEqual([
      { role: "user", content: "e aí" },
      { role: "assistant", content: "oi" },
    ]);
  });

  it("limita o histórico curto ao teto configurado", () => {
    const chat = Array.from({ length: 40 }, (_, i) => ({
      de: i % 2 ? "ryan" : "axiom",
      texto: `fala ${i}`,
    }));
    const h = historicoParaIA(chat);
    expect(h).toHaveLength(LIMITE_HISTORICO);
    expect(h[h.length - 1].content).toBe("fala 39");
  });
});

describe("memória rolante", () => {
  it("não resume antes de acumular o mínimo", () => {
    expect(mensagensNovasParaResumo(20, { resumo: "", marcas: 0 })).toBeNull();
  });

  it("devolve a faixa das mensagens antigas quando vale resumir", () => {
    const total = LIMITE_HISTORICO + 10;
    expect(mensagensNovasParaResumo(total, { resumo: "", marcas: 0 })).toEqual({
      inicio: 0,
      fim: 10,
    });
    expect(mensagensNovasParaResumo(total, { resumo: "x", marcas: 4 })).toEqual({
      inicio: 4,
      fim: 10,
    });
  });

  it("não resume de novo quando as marcas já cobrem a faixa", () => {
    expect(mensagensNovasParaResumo(LIMITE_HISTORICO + 3, { resumo: "x", marcas: 3 })).toBeNull();
  });

  it("extrativo preserva autores e respeita o teto", () => {
    const t = "Ryan: quero um jato\nSofia: com nota fiscal\nAxiom: boss man";
    const r = resumoExtrativo(t);
    expect(r).toContain("Ryan:");
    expect(r).toContain("Sofia:");
    expect(r.length).toBeLessThanOrEqual(900);
  });

  it("juntarResumo respeita o teto e mantém o mais novo", () => {
    const antigo = "A".repeat(1500);
    const novo = "B".repeat(600);
    const r = juntarResumo(antigo, novo);
    expect(r.length).toBeLessThanOrEqual(1800);
    expect(r.endsWith("B")).toBe(true);
  });
});

describe("config do motor novo", () => {
  it("liga raciocínio e define modelo do canal geral por padrão", () => {
    const cfg = configInicial();
    expect(cfg.raciocinio).toBe(true);
    expect(cfg.modelos.geral).toBe("deepseek-ai/deepseek-v4.1-flash");
    expect(cfg.modelos.sofia).toBe("deepseek-ai/deepseek-v4.1-flash");
  });
});

describe("presets de provedor", () => {
  it("tem ids únicos, URL segura e modelos preenchidos", () => {
    const ids = new Set(PRESETS_PROVEDOR.map((p) => p.id));
    expect(ids.size).toBe(PRESETS_PROVEDOR.length);
    for (const p of PRESETS_PROVEDOR) {
      const local = p.baseUrl.includes("localhost");
      expect(local || p.baseUrl.startsWith("https://")).toBe(true);
      for (const modelo of Object.values(p.modelos)) {
        expect(modelo.trim().length).toBeGreaterThan(0);
      }
      if (!local) expect(p.chaveUrl).toBeTruthy();
    }
  });

  it("aplicar preset troca para custom sem tocar na chave", () => {
    const groq = PRESETS_PROVEDOR.find((p) => p.id === "groq");
    expect(groq).toBeTruthy();
    const patch = aplicarPresetProvedor(groq!);
    expect(patch.provedor).toBe("custom");
    expect(patch.baseUrl).toBe("https://api.groq.com/openai/v1");
    expect(patch.apiKey).toBeUndefined();
    expect(patch.modelos?.sofia).toBe("openai/gpt-oss-120b");
  });
});
