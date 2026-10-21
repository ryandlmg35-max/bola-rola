import type { ConfigIA, ModelosIA, ProvedorIA } from "./types";

/** NVIDIA NIM — OpenAI-compatible, catálogo gratuito (rate-limited). */
export const BASE_NVIDIA = "https://integrate.api.nvidia.com/v1";

export interface ModeloCatalogo {
  id: string;
  nome: string;
  nota: string;
}

export const MODELOS_NVIDIA: ModeloCatalogo[] = [
  {
    id: "deepseek-ai/deepseek-v4.1-flash",
    nome: "DeepSeek V4.1 Flash",
    nota: "conversa longa e rápida, mais permissiva pra roleplay — Axiom e Sofia",
  },
  {
    id: "nvidia/nemotron-3-super-120b-a12b",
    nome: "Nemotron 3 Super 120B",
    nota: "instrução forte e JSON confiável — motor do mundo",
  },
  {
    id: "nvidia/nemotron-3.5-lightning-30b-a3b",
    nome: "Nemotron 3.5 Lightning 30B",
    nota: "rápido, mas o reasoning pode consumir o limite — exige maxTokens alto",
  },
  {
    id: "nvidia/nemotron-3-ultra-550b-a55b",
    nome: "Nemotron 3 Ultra 550B",
    nota: "pesado — reunião de fechamento",
  },
  {
    id: "nvidia/nemotron-nano-3-30b-a3b",
    nome: "Nemotron Nano 3 30B",
    nota: "leve — fallback econômico",
  },
  {
    id: "nvidia/nemotron-4-340b-instruct",
    nome: "Nemotron 4 340B (legado)",
    nota: "modelo antigo, ainda listado",
  },
  {
    id: "openai/gpt-oss-20b",
    nome: "GPT-OSS 20B",
    nota: "instrução forte e JSON consistente — narrador, mundo e conselho",
  },
];

export const NOMES_MODELOS: Record<keyof ModelosIA, string> = {
  narrador: "Narrador do turno",
  mundo: "Motor do mundo (eventos)",
  sofia: "Sofia (CFO)",
  axiom: "Axiom (chief of staff)",
  geral: "Canal aberto do 130º",
  conselho: "Conselho de fechamento",
};

export function modelosPadrao(provedor: ProvedorIA): ModelosIA {
  if (provedor === "nvidia") {
    // GPT-OSS 20B: raciocínio rápido pra narrativa, mundo e conselho.
    // DeepSeek V4.1 Flash: conversa longa e mais permissiva pro roleplay
    // ficcional de Sofia e Axiom (mesma escolha da migração v3 do store).
    return {
      narrador: "openai/gpt-oss-20b",
      mundo: "openai/gpt-oss-20b",
      sofia: "deepseek-ai/deepseek-v4.1-flash",
      axiom: "deepseek-ai/deepseek-v4.1-flash",
      geral: "deepseek-ai/deepseek-v4.1-flash",
      conselho: "openai/gpt-oss-20b",
    };
  }
  return {
    narrador: "gpt-4o-mini",
    mundo: "gpt-4o-mini",
    sofia: "gpt-4o-mini",
    axiom: "gpt-4o-mini",
    geral: "gpt-4o-mini",
    conselho: "gpt-4o-mini",
  };
}

export function configInicial(): ConfigIA {
  return {
    // A IA liga por padrão. Sem chave no cliente, o proxy usa NVIDIA_API_KEY
    // do servidor; sem nenhuma das duas, cada chamada falha e o turno cai no
    // motor local — sem travar.
    habilitada: true,
    provedor: "nvidia",
    baseUrl: BASE_NVIDIA,
    apiKey: "",
    modelos: modelosPadrao("nvidia"),
    raciocinio: true,
    versaoConfig: 4,
  };
}

export function aplicarPreset(provedor: ProvedorIA): Partial<ConfigIA> {
  return {
    provedor,
    baseUrl: provedor === "nvidia" ? BASE_NVIDIA : "https://api.openai.com/v1",
    modelos: modelosPadrao(provedor),
  };
}

/**
 * Atalhos pra provedores OpenAI-compatible com tier grátis (ou local).
 * IDs conferidos no catálogo público em out/2026 — se o provedor aposentar
 * um modelo, basta trocar o campo "Modelo por função" em Ajustes.
 */
export interface PresetProvedor {
  id: "groq" | "openrouter" | "gemini" | "ollama";
  nome: string;
  baseUrl: string;
  /** Onde tirar a chave; null = não precisa (local). */
  chaveUrl: string | null;
  selo: "grátis" | "local";
  nota: string;
  modelos: ModelosIA;
  /** Local pequeno: uma chamada só por padrão (o planejador dobraria a espera). */
  raciocinio?: boolean;
}

export const PRESETS_PROVEDOR: PresetProvedor[] = [
  {
    id: "groq",
    nome: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    chaveUrl: "https://console.groq.com/keys",
    selo: "grátis",
    nota: "GPT-OSS 120B/20B no silício da Groq — o mais rápido do lote.",
    modelos: {
      narrador: "openai/gpt-oss-20b",
      mundo: "openai/gpt-oss-120b",
      sofia: "openai/gpt-oss-120b",
      axiom: "openai/gpt-oss-120b",
      geral: "openai/gpt-oss-120b",
      conselho: "openai/gpt-oss-120b",
    },
  },
  {
    id: "openrouter",
    nome: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    chaveUrl: "https://openrouter.ai/keys",
    selo: "grátis",
    nota: "Modelos :free (Nemotron/MiniMax). Fila maior, contexto de 1M.",
    modelos: {
      narrador: "nvidia/nemotron-3.5-lightning:free",
      mundo: "nvidia/nemotron-3-super-120b-a12b:free",
      sofia: "minimax/minimax-m3.1-flash:free",
      axiom: "minimax/minimax-m3.1-flash:free",
      geral: "minimax/minimax-m3.1-flash:free",
      conselho: "nvidia/nemotron-3-super-120b-a12b:free",
    },
  },
  {
    id: "gemini",
    nome: "Google Gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    chaveUrl: "https://aistudio.google.com/apikey",
    selo: "grátis",
    nota: "Endpoint OpenAI-compatível do AI Studio; filtro de conteúdo mais rígido.",
    modelos: {
      narrador: "gemini-3.5-flash-lite",
      mundo: "gemini-3.8-flash",
      sofia: "gemini-3.8-flash",
      axiom: "gemini-3.8-flash",
      geral: "gemini-3.8-flash",
      conselho: "gemini-3.8-flash",
    },
  },
  {
    id: "ollama",
    nome: "Ollama (local)",
    baseUrl: "http://localhost:11434/v1",
    chaveUrl: null,
    selo: "local",
    nota: "Dolphin 3 8B já baixado (4,9 GB), sem censura e 100% GPU. Sem chave.",
    raciocinio: false,
    modelos: {
      narrador: "dolphin3:8b",
      mundo: "dolphin3:8b",
      sofia: "dolphin3:8b",
      axiom: "dolphin3:8b",
      geral: "dolphin3:8b",
      conselho: "dolphin3:8b",
    },
  },
];

export function aplicarPresetProvedor(preset: PresetProvedor): Partial<ConfigIA> {
  return {
    provedor: "custom",
    baseUrl: preset.baseUrl,
    modelos: { ...preset.modelos },
    ...(preset.raciocinio === undefined ? {} : { raciocinio: preset.raciocinio }),
  };
}

export interface MensagemIA {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpcoesIA {
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
}

export interface ResultadoIA {
  texto: string | null;
  erro: string | null;
  status: number | null;
  latenciaMs: number;
}

/** Última falha de IA da sessão — a UI mostra quando o motor local assumiu. */
let ultimaFalha: { erro: string; status: number | null; quando: number } | null = null;

export function ultimaFalhaIA(): { erro: string; status: number | null; quando: number } | null {
  return ultimaFalha;
}

export function limparFalhaIA(): void {
  ultimaFalha = null;
}

/**
 * Chamada única, sem retry: o motor do RP precisa de previsibilidade.
 * Qualquer falha (401, 429, timeout, CORS) devolve erro e o chamador
 * cai na versão local — nunca trava o turno.
 */
export async function chamarIA(
  config: ConfigIA,
  modelo: string,
  mensagens: MensagemIA[],
  opcoes: OpcoesIA = {},
): Promise<ResultadoIA> {
  const inicio = performance.now();
  if (!modelo.trim()) {
    return { texto: null, erro: "modelo vazio", status: null, latenciaMs: 0 };
  }
  const chaveCliente = config.apiKey.trim();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opcoes.timeoutMs ?? 45_000);
  const base = config.baseUrl.replace(/\/$/, "");
  // Modelo local pequeno esquenta rápido: 0.95 vira monólogo. Teto de 0.75
  // em localhost mantém a fala curta e no personagem.
  const local = /localhost|127\.0\.0\.1/.test(base);
  const temperatura = opcoes.temperature ?? 0.85;
  const payload = {
    model: modelo,
    messages: mensagens,
    temperature: local ? Math.min(temperatura, 0.75) : temperatura,
    max_tokens: opcoes.maxTokens ?? 700,
    stream: false,
  };
  // Toda falha vira registro público: a UI precisa mostrar quando o motor
  // local assumiu no lugar da IA — fingir que é IA é pior que falhar.
  const falha = (erro: string, status: number | null, latenciaMs: number): ResultadoIA => {
    ultimaFalha = { erro, status, quando: Date.now() };
    return { texto: null, erro, status, latenciaMs };
  };
  try {
    // 1º caminho: proxy same-origin do app (NVIDIA não manda CORS pro browser).
    // 2º: chamada direta, pra preview estático/endpoint que aceite CORS.
    let resp: Response | null = null;
    try {
      resp = await fetch("/api/ia", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseUrl: config.baseUrl,
          apiKey: chaveCliente,
          body: payload,
        }),
      });
      if (resp.status === 404 || resp.status === 405) resp = null;
    } catch {
      resp = null;
    }
    if (!resp) {
      if (!chaveCliente) {
        return falha(
          "proxy indisponível e sem chave local",
          null,
          Math.round(performance.now() - inicio),
        );
      }
      resp = await fetch(`${base}/chat/completions`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${chaveCliente}`,
        },
        body: JSON.stringify(payload),
      });
    }

    const latenciaMs = Math.round(performance.now() - inicio);
    if (!resp.ok) {
      const corpo = await resp.text().catch(() => "");
      const detalhe = corpo.replace(/\s+/g, " ").slice(0, 220);
      return falha(`HTTP ${resp.status}${detalhe ? ` — ${detalhe}` : ""}`, resp.status, latenciaMs);
    }
    const contentType = resp.headers.get("content-type") ?? "";
    if (!contentType.includes("json")) {
      return falha(
        `resposta não-JSON (${contentType || "sem content-type"})`,
        resp.status,
        latenciaMs,
      );
    }
    const data = (await resp.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const texto = (data.choices?.[0]?.message?.content ?? "").trim();
    if (!texto) {
      return falha("resposta vazia", resp.status, latenciaMs);
    }
    ultimaFalha = null;
    return { texto, erro: null, status: resp.status, latenciaMs };
  } catch (e) {
    const latenciaMs = Math.round(performance.now() - inicio);
    const erro = e instanceof DOMException && e.name === "AbortError" ? "timeout" : String(e);
    return falha(erro.slice(0, 220), null, latenciaMs);
  } finally {
    clearTimeout(timeout);
  }
}

/** Extrai o primeiro objeto JSON válido do texto (modelos às vezes enchem de prosa). */
export function extrairJSON<T>(bruto: string): T | null {
  const ini = bruto.indexOf("{");
  if (ini < 0) return null;
  let profundidade = 0;
  let emString = false;
  let escape = false;
  for (let i = ini; i < bruto.length; i++) {
    const c = bruto[i];
    if (emString) {
      if (escape) escape = false;
      else if (c === "\\") escape = true;
      else if (c === '"') emString = false;
      continue;
    }
    if (c === '"') emString = true;
    else if (c === "{") profundidade++;
    else if (c === "}") {
      profundidade--;
      if (profundidade === 0) {
        try {
          return JSON.parse(bruto.slice(ini, i + 1)) as T;
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

export async function testarIA(
  config: ConfigIA,
): Promise<{ ok: boolean; detalhe: string; modelo: string }> {
  const modelo = config.modelos.axiom;
  const r = await chamarIA(
    config,
    modelo,
    [
      { role: "system", content: "Responda só: ok" },
      { role: "user", content: "ping" },
    ],
    { maxTokens: 256, temperature: 0, timeoutMs: 60_000 },
  );
  if (r.texto) {
    return {
      ok: true,
      detalhe: `respondeu em ${r.latenciaMs}ms com ${modelo}`,
      modelo,
    };
  }
  return { ok: false, detalhe: r.erro ?? "falhou sem detalhe", modelo };
}

/** Clamp de números vindos de IA — o caixa nunca depende da imaginação do modelo. */
export function limitar(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
