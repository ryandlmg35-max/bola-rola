import { describe, expect, it } from "vitest";
import { estadoInicial } from "./src/rp/estadoInicial";
import { respostaLocalSofia, respostaSocialSofia } from "./src/rp/sofia";
import { useRP } from "./src/rp/store";

// Palavras que denunciavam o bug: "oi amor" virava monólogo de CFO.
const TRABALHO =
  /relatório|relatorio|cláusula|clausula|pendência|pendencia|auditoria|conselho|\bcaixa\b|130º|CFO|planilha|extrato|tesouraria/i;

function emCasa() {
  const st = estadoInicial();
  st.localizacao = "casa";
  st.sofia = { estresse: 18, energia: 82 };
  return st;
}

describe("camada social da Sofia", () => {
  it("responde 'oi amor' como esposa em casa, sem trabalho", () => {
    const r = respostaSocialSofia(emCasa(), "oi amor");
    expect(r).toBeTruthy();
    expect(r!).not.toMatch(TRABALHO);
    expect(r!).toMatch(/amor|vem|varanda|casa|saudade/i);
    expect(r!.length).toBeLessThanOrEqual(200);
  });

  it("devolve bom dia / boa noite no horário certo", () => {
    const st = emCasa();
    expect(respostaSocialSofia(st, "bom dia, amor")).toMatch(/^Bom dia/);
    expect(respostaSocialSofia(st, "boa noite")).toMatch(/^Boa noite/);
    expect(respostaSocialSofia(st, "oi")).toBeTruthy();
  });

  it("trata afeto e 'como você tá' sem puxar pauta", () => {
    const st = emCasa();
    const amo = respostaSocialSofia(st, "te amo");
    const como = respostaSocialSofia(st, "como você tá, amor?");
    expect(amo).toMatch(/amo|amor/i);
    expect(como).toBeTruthy();
    for (const r of [amo, como]) expect(r!).not.toMatch(TRABALHO);
  });

  it("pedido de presença não vira programa de passeio", () => {
    const r = respostaSocialSofia(emCasa(), "tô de saco cheio do conselho. vem cá.");
    expect(r).toMatch(/já vou|tô indo/i);
    expect(r).not.toMatch(/que tal|passeio|sorvete/i);
  });

  it("cansaço recebe cuidado, não relatório", () => {
    const r = respostaSocialSofia(emCasa(), "tô cansado");
    expect(r).toMatch(/deita|sapato|senta/i);
  });

  it("presença + cansaço responde os dois", () => {
    const r = respostaSocialSofia(emCasa(), "tô cansado, vem cá");
    expect(r).toMatch(/deita|sapato/i);
  });

  it("não intercepta conversa que não é social", () => {
    const st = emCasa();
    expect(respostaSocialSofia(st, "oi amor, você viu o relatório?")).toBeNull();
    expect(respostaSocialSofia(st, "gastar 500 milhões numa festa")).toBeNull();
    expect(respostaSocialSofia(st, "me conta uma coisa")).toBeNull();
  });

  it("fallback local em casa não fala de torre, CFO nem relatório", () => {
    const r = respostaLocalSofia(emCasa(), "me conta uma coisa");
    expect(r).not.toMatch(TRABALHO);
    expect(r).not.toMatch(/130º/);
    expect(r.length).toBeGreaterThan(10);
  });

  it("a ação do chat em casa não chama IA para saudação", async () => {
    const st = emCasa();
    st.config = { ...st.config, habilitada: false };
    useRP.setState({ estado: st, sofiaPensando: false, iaErro: null });

    await useRP.getState().falarComSofia("oi amor");

    const chat = useRP.getState().estado.chatSofia;
    const ultima = chat[chat.length - 1];
    expect(ultima.de).toBe("sofia");
    expect(ultima.fonte).toBe("local");
    expect(ultima.texto).not.toMatch(TRABALHO);
    expect(useRP.getState().sofiaPensando).toBe(false);
  });
});
