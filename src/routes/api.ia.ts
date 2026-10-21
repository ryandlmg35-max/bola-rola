import { createFileRoute } from "@tanstack/react-router";

/**
 * Proxy same-origin pra APIs de IA (NVIDIA NIM, OpenAI-compatible).
 * Motivo: integrate.api.nvidia.com não manda Access-Control-Allow-Origin,
 * então o navegador bloqueia a chamada direta.
 *
 * A chave pode vir do cliente (Ajustes) ou de NVIDIA_API_KEY no servidor.
 * Quando vem do servidor, NUNCA desce pro navegador e só é usada no host
 * oficial da NVIDIA — assim um body malicioso não exfiltra a chave.
 *
 * Travas: só https (ou http em localhost), sem IP privado/metadata (SSRF),
 * corpo pequeno, timeout curto e resposta HTML do provedor vira erro JSON.
 */

const TAMANHO_MAX = 160 * 1024;
const TIMEOUT_MS = 120_000;
const HOST_NVIDIA = "integrate.api.nvidia.com";

function chaveDoServidor(): string {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process
    ?.env;
  return env?.NVIDIA_API_KEY?.trim() ?? "";
}

function urlPermitida(baseUrl: string): URL | null {
  let url: URL;
  try {
    url = new URL(baseUrl);
  } catch {
    return null;
  }
  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (url.protocol !== "https:" && !(url.protocol === "http:" && local)) return null;
  const h = url.hostname;
  if (local) return url;
  if (/^(10\.|192\.168\.|169\.254\.|127\.)/.test(h)) return null;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return null;
  if (h.endsWith(".local") || h === "metadata.google.internal") return null;
  return url;
}

/** Aceita base URL com ou sem /v1 e com ou sem /chat/completions. */
function endpointChat(url: URL): string {
  const path = url.pathname.replace(/\/+$/, "");
  return path.endsWith("/chat/completions")
    ? `${url.origin}${path}`
    : `${url.origin}${path}/chat/completions`;
}

function json(dados: unknown, status: number): Response {
  return new Response(JSON.stringify(dados), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

export const Route = createFileRoute("/api/ia")({
  server: {
    handlers: {
      // Diagnóstico pro Ajustes: diz se o servidor tem chave, sem revelar a chave.
      GET: async () => json({ servidor: Boolean(chaveDoServidor()) }, 200),

      POST: async ({ request }) => {
        const tamanho = Number(request.headers.get("content-length") ?? 0);
        if (Number.isFinite(tamanho) && tamanho > TAMANHO_MAX) {
          return json({ error: "corpo grande demais" }, 413);
        }

        let entrada: unknown;
        try {
          entrada = await request.json();
        } catch {
          return json({ error: "JSON inválido" }, 400);
        }
        const dados = entrada as {
          baseUrl?: unknown;
          apiKey?: unknown;
          body?: unknown;
        };
        if (typeof dados.baseUrl !== "string") {
          return json({ error: "baseUrl é obrigatório" }, 400);
        }
        if (!dados.body || typeof dados.body !== "object") {
          return json({ error: "body inválido" }, 400);
        }

        const corpo = JSON.stringify(dados.body);
        if (new TextEncoder().encode(corpo).length > TAMANHO_MAX) {
          return json({ error: "corpo grande demais" }, 413);
        }

        const chaveCliente = typeof dados.apiKey === "string" ? dados.apiKey.trim() : "";

        const url = urlPermitida(dados.baseUrl);
        if (!url) return json({ error: "baseUrl não permitida" }, 400);

        const urlLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
        // A chave do servidor só vale no host oficial da NVIDIA; qualquer outro
        // provedor exige chave do cliente (ou nenhuma, se for localhost).
        const chaveServidor = chaveCliente || url.hostname !== HOST_NVIDIA ? "" : chaveDoServidor();
        const apiKey = chaveCliente || chaveServidor;
        if (!apiKey && !urlLocal) {
          return json(
            { error: "sem chave de API (configure NVIDIA_API_KEY ou cole uma chave em Ajustes)" },
            400,
          );
        }

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
        try {
          const resp = await fetch(endpointChat(url), {
            method: "POST",
            signal: controller.signal,
            headers: {
              "Content-Type": "application/json",
              ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
            },
            body: corpo,
          });
          const texto = await resp.text();
          const contentType = resp.headers.get("content-type") ?? "";
          if (contentType.includes("text/html")) {
            return json({ error: "provedor devolveu HTML em vez de JSON" }, 502);
          }
          if (resp.ok && !contentType.includes("json")) {
            return json({ error: `provedor devolveu ${contentType || "sem content-type"}` }, 502);
          }
          return new Response(texto, {
            status: resp.status,
            headers: {
              "content-type": contentType || "application/json",
              "cache-control": "no-store",
            },
          });
        } catch (e) {
          const erro =
            e instanceof Error && e.name === "AbortError" ? "timeout no provedor" : String(e);
          return json({ error: erro.slice(0, 240) }, 502);
        } finally {
          clearTimeout(timer);
        }
      },
    },
  },
});
