import { SEDES, sedePorId } from "./sedes";
import type { ConviteReuniao, EstadoRP } from "./types";

/**
 * Logística do império: sedes reais + Casa MR em Greenwich.
 * Tudo aqui é determinístico e sem Three.js — os números de distância,
 * autonomia e tempo entram na UI e no save. O mapa 3D só lê estes dados.
 */

export interface Coord {
  lat: number;
  lon: number;
}

export type TipoLocal = "base" | "casa" | "sede";

export interface LocalViagem extends Coord {
  id: string;
  nome: string;
  cidade: string;
  pais: string;
  tipo: TipoLocal;
}

export interface Veiculo {
  id: string;
  nome: string;
  tipo: "jato" | "helicoptero" | "carro";
  velocidadeKmh: number;
  alcanceKm: number;
  nota: string;
}

export interface OpcaoViagem extends Veiculo {
  km: number;
  minutos: number;
  dentro: boolean;
  recomendado: boolean;
}

export const CASA_ID = "casa";

/** Casa MR — Greenwich, Connecticut. O heliponto H e a doca ficam no terreno. */
export const CASA_MR: LocalViagem = {
  id: CASA_ID,
  nome: "Casa MR — Greenwich",
  cidade: "Greenwich, CT",
  pais: "🇺🇸 EUA",
  lat: 41.0262,
  lon: -73.6282,
  tipo: "casa",
};

function paraLocal(id: string): LocalViagem {
  if (id === CASA_ID) return CASA_MR;
  const sede = sedePorId(id === "base" ? "tower" : id) ?? sedePorId("tower")!;
  return {
    id: sede.id,
    nome: sede.nome,
    cidade: sede.cidade,
    pais: sede.pais,
    lat: sede.lat,
    lon: sede.lon,
    tipo: sede.id === "tower" ? "base" : "sede",
  };
}

export function localPorId(id: string | null | undefined): LocalViagem {
  return paraLocal(id ?? "tower");
}

export function nomeLocal(local: LocalViagem): string {
  if (local.tipo === "base") return "Base principal · Nova York";
  if (local.tipo === "casa") return "Casa · Greenwich";
  return `${local.cidade} · ${local.pais}`;
}

const FROTA_BASE: Veiculo[] = [
  {
    id: "g800",
    nome: "Gulfstream G800",
    tipo: "jato",
    velocidadeKmh: 900,
    alcanceKm: 14_800,
    nota: "Teterboro → qualquer fuso. Bar, cama e uplink executivo.",
  },
  {
    id: "aw139",
    nome: "Leonardo AW139",
    tipo: "helicoptero",
    velocidadeKmh: 280,
    alcanceKm: 1_250,
    nota: "Heliponto da torre. O jeito mais rápido de sair de Manhattan.",
  },
  {
    id: "escalade",
    nome: "Cadillac Escalade blindado",
    tipo: "carro",
    velocidadeKmh: 90,
    alcanceKm: 600,
    nota: "Comboio da casa. Para reunião a poucos quarteirões ou no interior.",
  },
];

const FROTA_CASA: Veiculo[] = [
  {
    id: "h145",
    nome: "Airbus H145",
    tipo: "helicoptero",
    velocidadeKmh: 240,
    alcanceKm: 700,
    nota: "Heliponto H da casa. Greenwich ↔ Manhattan em ~25 minutos.",
  },
  {
    id: "phenom",
    nome: "Embraer Phenom 300E",
    tipo: "jato",
    velocidadeKmh: 800,
    alcanceKm: 3_650,
    nota: "Westchester County Airport, 20 minutos da casa. Coast to coast.",
  },
  {
    id: "range",
    nome: "Range Rover SV",
    tipo: "carro",
    velocidadeKmh: 90,
    alcanceKm: 600,
    nota: "Comboio da casa. Para a cidade, o aeroporto ou a reunião local.",
  },
];

const FROTA_SEDE: Veiculo[] = [
  {
    id: "jato-sede",
    nome: "Jato executivo da sede",
    tipo: "jato",
    velocidadeKmh: 850,
    alcanceKm: 12_000,
    nota: "Fretado pela Space. Pista mais próxima, tripulação em 40 min.",
  },
  {
    id: "helo-sede",
    nome: "Helicóptero da sede",
    tipo: "helicoptero",
    velocidadeKmh: 260,
    alcanceKm: 800,
    nota: "Translado urbano e para o aeroporto. Sem trânsito, sem paparazzi.",
  },
  {
    id: "suv-sede",
    nome: "SUV blindado da sede",
    tipo: "carro",
    velocidadeKmh: 85,
    alcanceKm: 550,
    nota: "Comboio local com segurança. Para reuniões na mesma cidade.",
  },
];

export function veiculosEm(local: LocalViagem): Veiculo[] {
  if (local.tipo === "base") return FROTA_BASE;
  if (local.tipo === "casa") return FROTA_CASA;
  return FROTA_SEDE;
}

export function distanciaKm(a: Coord, b: Coord): number {
  const R = 6371;
  const rad = (n: number) => (n * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

export function duracaoMin(veiculo: Veiculo, km: number): number {
  const embarque = veiculo.tipo === "jato" ? 45 : veiculo.tipo === "helicoptero" ? 20 : 10;
  return Math.round((km / veiculo.velocidadeKmh) * 60 + embarque);
}

export function formatarDuracao(minutos: number): string {
  if (minutos < 60) return `${minutos} min`;
  if (minutos < 1440) {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return m ? `${h}h ${m}min` : `${h}h`;
  }
  const dias = Math.floor(minutos / 1440);
  const h = Math.floor((minutos % 1440) / 60);
  return `${dias}d ${h}h`;
}

export function opcoesViagem(origem: LocalViagem, destino: LocalViagem): OpcaoViagem[] {
  const km = distanciaKm(origem, destino);
  const base = veiculosEm(origem).map((v) => {
    const minutos = duracaoMin(v, km);
    return {
      ...v,
      km,
      minutos,
      dentro: km <= v.alcanceKm,
      recomendado: false,
    };
  });
  const viaveis = base.filter((v) => v.dentro).sort((a, b) => a.minutos - b.minutos);
  const melhor = viaveis[0]?.id;
  return base.map((v) => ({ ...v, recomendado: v.id === melhor }));
}

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

const DESTINOS: { teste: RegExp; id: string }[] = [
  { teste: /greenwich|connecticut|\bcasa\b|\bhome\b/, id: CASA_ID },
  {
    teste: /\bbase\b|\btower\b|\btorre\b|manhattan|nova york|new york|\bnyc?\b/,
    id: "tower",
  },
  { teste: /brasilia/, id: "gov" },
  { teste: /los angeles|hollywood/, id: "media" },
  { teste: /menlo park|silicon valley|palo alto/, id: "tech" },
  { teste: /dallas/, id: "sports" },
  { teste: /kyoto|toquio|tokyo/, id: "interactive" },
  { teste: /austin/, id: "ai" },
  { teste: /ilhabela/, id: "ocean" },
  { teste: /nassau|bahamas|ilha mr/, id: "ilha" },
  { teste: /california|califórnia/, id: "universidade" },
  { teste: /cupertino/, id: "foundries" },
  { teste: /sao paulo|\bsp\b/, id: "consumer" },
];

export function resolverLocal(texto: string, atual: string): string {
  const t = normalizar(texto);
  for (const d of DESTINOS) {
    if (d.teste.test(t)) return d.id;
  }
  for (const sede of SEDES) {
    if (t.includes(normalizar(sede.cidade)) || t.includes(normalizar(sede.nome))) return sede.id;
  }
  return atual;
}

const TEMPO: { teste: RegExp; texto: string }[] = [
  { teste: /amanha/, texto: "Amanhã" },
  { teste: /hoje|agora|daqui a pouco/, texto: "Hoje" },
  { teste: /segunda/, texto: "Segunda-feira" },
  { teste: /terca/, texto: "Terça-feira" },
  { teste: /quarta/, texto: "Quarta-feira" },
  { teste: /quinta/, texto: "Quinta-feira" },
  { teste: /sexta/, texto: "Sexta-feira" },
  { teste: /sabado/, texto: "Sábado" },
  { teste: /domingo/, texto: "Domingo" },
  { teste: /proxima semana|semana que vem/, texto: "Próxima semana" },
];

function nomesCitados(texto: string, estado: EstadoRP): string[] {
  const t = normalizar(texto);
  const achados: string[] = [];
  if (/conselho|diretoria|board/.test(t)) {
    achados.push("Sofia Mendes", "Axiom", "Daniel Cross");
  }
  for (const nome of Object.keys(estado.relacoes)) {
    if (achados.includes(nome)) continue;
    const n = normalizar(nome);
    const partes = n.split(" ");
    const primeiro = partes[0];
    const ultimo = partes[partes.length - 1];
    const bate =
      (n.length >= 4 && t.includes(n)) ||
      (primeiro.length >= 4 && t.includes(primeiro)) ||
      (partes.length > 1 && ultimo.length >= 4 && t.includes(ultimo));
    if (bate) achados.push(nome);
  }
  if (achados.length === 0) achados.push("Sofia Mendes", "Axiom");
  if (!achados.includes("Axiom")) {
    if (achados.length < 4) achados.push("Axiom");
    else achados[3] = "Axiom";
  }
  return [...new Set(achados)].slice(0, 4);
}

/**
 * Detector determinístico de intenção de reunião. Roda antes da resposta da IA;
 * se o chat falhar, o botão de ir para a reunião ainda aparece.
 */
export function detectarReuniao(texto: string, estado: EstadoRP): ConviteReuniao | null {
  const t = normalizar(texto);
  const temReuniao = /\b(reuniao|reunir|meeting|agenda|encontro|board)\b/.test(t);
  if (!temReuniao) return null;
  if (/cancel|desmarc|como foi|resumo|ata da|depois da|nao quero/.test(t)) return null;

  const acao =
    /\b(marca|marcar|marcamos|agenda|agendar|agendamos|convoca|convocar|chama|chamar|quero|vamos|preciso)\b/.test(
      t,
    );
  const comAlguem = /\b(com|entre)\b/.test(t) || /reuniao com|encontro com/.test(t);
  if (!acao && !comAlguem) return null;

  const participantes = nomesCitados(texto, estado);
  const localId = resolverLocal(texto, estado.localizacao);
  let titulo = "Reunião de diretoria";
  if (/conselho/.test(t)) titulo = "Conselho extraordinário";
  else if (/diretoria|board/.test(t)) titulo = "Reunião de diretoria";
  else if (participantes.length) titulo = `Reunião com ${participantes.slice(0, 2).join(" e ")}`;

  const quando = TEMPO.find((x) => x.teste.test(t))?.texto ?? "Esta semana";
  const id = `reuniao-${estado.turno}-${Date.now().toString(36)}`;

  return {
    id,
    titulo,
    localId,
    origemId: estado.localizacao,
    participantes,
    quando,
    criadoTurno: estado.turno,
    fonte: "local",
  };
}

/** A decisão da Sofia é dela; o Ryan só chama. */
export function decisaoSofiaCasa(estado: EstadoRP): { aceita: boolean; linha: string } {
  if (estado.sofia.estresse >= 75) {
    return {
      aceita: false,
      linha:
        "Hoje não, Ryan. Eu tô com o fechamento da 14.8 na cabeça e um conselho inteiro me devendo explicação. Vai pra Greenwich, dorme cedo — eu fico em Nova York.",
    };
  }
  if (estado.mundo.tensao >= 72) {
    return {
      aceita: false,
      linha:
        "Não vou. A tensão no conselho tá em " +
        estado.mundo.tensao +
        "/100 e se eu sair da torre agora eles quebram a sala. Segura essa noite sem mim.",
    };
  }
  if (estado.sofia.energia < 18) {
    return {
      aceita: false,
      linha:
        "Casa? Eu tô sem energia, Ryan. Literalmente. Vou apagar no meu quarto e amanhã a gente vê o mundo. Vai sem mim.",
    };
  }
  return {
    aceita: true,
    linha:
      "Vou sim. Me dá quarenta minutos pra fechar com a tesouraria e eu subo no H145. Deixa a luz da doca acesa e o vinho respirando.",
  };
}
