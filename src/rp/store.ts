import { create } from "zustand";
import type {
  ConfigIA,
  EntradaFeed,
  EstadoRP,
  ModelosIA,
  MsgChat,
  MsgCEO,
  MsgGeral,
  ProvedorIA,
} from "./types";
import { respostaCEO, perfilPorId } from "./ceos";
import { estadoInicial } from "./estadoInicial";
import { LIMITE_CARTAO, aplicar, fmtUSD } from "./engine";
import {
  gerarEventosIA,
  narrarPorIA,
  recadoAutoIA,
  responderAxiomIA,
  responderGeralIA,
  responderSofiaIA,
} from "./narrador";
import { deltaSofia, respostaLocalSofia } from "./sofia";
import { respostaLocalAxiom } from "./axiom";
import { ultimaFalhaIA } from "./ia";
import { aplicarImpacto, impactoConversa, repercussaoChat, respostaLocalGeral } from "./canal";
import { avancarSemanaComEventos, eventosLocais, fecharMesLocal, recadoLocal } from "./mundo";
import { formatarCalendario, mesFechado, proximaSemana } from "./calendario";
import { rng, sorteia } from "./rng";
import { decisaoSofiaCasa, detectarReuniao, localPorId, opcoesViagem } from "./viagens";

const CHAVE_LS = "space-mr-rp-v1";

type ResultadoSemana = "ok" | "mes" | "ocupado";

interface LojaRP {
  estado: EstadoRP;
  pensando: boolean;
  sofiaPensando: boolean;
  axiomPensando: boolean;
  geralPensando: boolean;
  /** Última falha de IA da sessão — a UI mostra quando o motor local assumiu. */
  iaErro: string | null;
  enviar: (acao: string) => Promise<void>;
  /** Conversa pública: Axiom responde no feed principal, impacta o RP. */
  conversar: (texto: string) => void;
  /** Chat geral do 130º: canal aberto, todo mundo ouve, impacta o império. */
  falarNoGeral: (texto: string) => Promise<void>;
  falarComSofia: (texto: string) => Promise<void>;
  falarComAxiom: (texto: string) => Promise<void>;
  falarComCEO: (divisaoId: string, texto: string) => void;
  avancarSemana: (rapido?: boolean) => Promise<ResultadoSemana>;
  fecharMes: (diretrizId: string, abertura?: string) => boolean;
  marcarLidas: (quem: "sofia" | "axiom") => void;
  dispensarConvite: () => void;
  viajarPara: (destinoId: string, veiculoId: string) => boolean;
  entrarNaReuniao: () => boolean;
  encerrarReuniao: () => void;
  convidarSofiaCasa: (forcar?: boolean) => void;
  ajustarConfig: (c: Partial<ConfigIA>) => void;
  ajustarModelo: (chave: keyof ModelosIA, valor: string) => void;
  resetar: () => void;
  exportar: () => void;
  importar: (json: string) => boolean;
  hidratar: () => void;
}

function salvar(estado: EstadoRP): void {
  try {
    localStorage.setItem(CHAVE_LS, JSON.stringify(estado));
  } catch {
    // quota estourada — a sessão segue em memória
  }
}

function carregar(): EstadoRP | null {
  try {
    const bruto = localStorage.getItem(CHAVE_LS);
    if (!bruto) return null;
    const parsed = JSON.parse(bruto) as EstadoRP;
    if (typeof parsed.turno !== "number" || !Array.isArray(parsed.feed)) return null;
    return normalizar(parsed);
  } catch {
    return null;
  }
}

/** Migração de save: catálogo vem do código, progresso vem do navegador. */
function normalizar(salvo: EstadoRP): EstadoRP {
  const inicial = estadoInicial();
  const cfgSalva = salvo.config as Partial<ConfigIA> | undefined;
  const versaoConfig = typeof cfgSalva?.versaoConfig === "number" ? cfgSalva.versaoConfig : 0;
  const migrarIA = versaoConfig < 2;
  // v3: Sofia e Axiom migram pro DeepSeek (mais permissivo pra roleplay adulto).
  const migrarModelos = versaoConfig < 3;
  const baseUrlSalva =
    typeof cfgSalva?.baseUrl === "string" && cfgSalva.baseUrl
      ? cfgSalva.baseUrl
      : inicial.config.baseUrl;
  const provedor: ProvedorIA =
    cfgSalva?.provedor ?? (baseUrlSalva.includes("nvidia") ? "nvidia" : "custom");
  // Saves antigos apontavam pra DeepSeek/Nemotron sem acesso nesta conta.
  // Na migração v2, volta pro catálogo padrão; depois o usuário escolhe à vontade.
  const baseUrl = migrarIA && provedor === "nvidia" ? inicial.config.baseUrl : baseUrlSalva;
  const modelosSalvos = cfgSalva?.modelos as Partial<ModelosIA> | undefined;
  const legado = (cfgSalva as { modelo?: string } | undefined)?.modelo;
  let modelos: ModelosIA;
  if (migrarIA && provedor === "nvidia") {
    modelos = inicial.config.modelos;
  } else if (modelosSalvos) {
    modelos = { ...inicial.config.modelos, ...modelosSalvos };
    // v3: força Sofia e Axiom pro DeepSeek se ainda estiverem no gpt-oss-20b
    if (migrarModelos && provedor === "nvidia") {
      if (modelos.sofia === "openai/gpt-oss-20b") {
        modelos = { ...modelos, sofia: "deepseek-ai/deepseek-v4.1-flash" };
      }
      if (modelos.axiom === "openai/gpt-oss-20b") {
        modelos = { ...modelos, axiom: "deepseek-ai/deepseek-v4.1-flash" };
      }
    }
  } else if (legado) {
    modelos = {
      narrador: legado,
      mundo: legado,
      sofia: legado,
      axiom: legado,
      conselho: legado,
    };
  } else {
    modelos = inicial.config.modelos;
  }

  return {
    ...inicial,
    ...salvo,
    calendario: salvo.calendario ?? inicial.calendario,
    data:
      salvo.calendario && !salvo.data?.startsWith("Turno")
        ? formatarCalendario(salvo.calendario)
        : formatarCalendario(salvo.calendario ?? inicial.calendario),
    cartao: typeof salvo.cartao === "number" ? salvo.cartao : inicial.cartao,
    chatSofia: Array.isArray(salvo.chatSofia) ? salvo.chatSofia : inicial.chatSofia,
    chatAxiom: Array.isArray(salvo.chatAxiom) ? salvo.chatAxiom : inicial.chatAxiom,
    chatGeral: Array.isArray(salvo.chatGeral) ? salvo.chatGeral : inicial.chatGeral,
    sofia: {
      estresse:
        typeof salvo.sofia?.estresse === "number" ? salvo.sofia.estresse : inicial.sofia.estresse,
      energia:
        typeof salvo.sofia?.energia === "number" ? salvo.sofia.energia : inicial.sofia.energia,
    },
    mundo: {
      tensao: typeof salvo.mundo?.tensao === "number" ? salvo.mundo.tensao : inicial.mundo.tensao,
      conflitos: Array.isArray(salvo.mundo?.conflitos)
        ? salvo.mundo.conflitos
        : inicial.mundo.conflitos,
      clima: typeof salvo.mundo?.clima === "string" ? salvo.mundo.clima : inicial.mundo.clima,
      ultimaSemana: Array.isArray(salvo.mundo?.ultimaSemana) ? salvo.mundo.ultimaSemana : [],
    },
    plano: { ...inicial.plano, ...(salvo.plano ?? {}) },
    ultimoRelatorio: salvo.ultimoRelatorio ?? null,
    naoLidas: {
      sofia: typeof salvo.naoLidas?.sofia === "number" ? salvo.naoLidas.sofia : 0,
      axiom: typeof salvo.naoLidas?.axiom === "number" ? salvo.naoLidas.axiom : 0,
    },
    divisoes: inicial.divisoes,
    relacoes: { ...inicial.relacoes, ...salvo.relacoes },
    pendencias: inicial.pendencias.map((p) => {
      const antiga = salvo.pendencias?.find((x) => x.id === p.id);
      return antiga ? { ...p, passo: antiga.passo, ativa: antiga.ativa } : p;
    }),
    config: {
      ...inicial.config,
      ...cfgSalva,
      provedor,
      baseUrl,
      modelos,
      habilitada: migrarIA ? true : (cfgSalva?.habilitada ?? inicial.config.habilitada),
      apiKey: migrarIA ? "" : (cfgSalva?.apiKey ?? ""),
      versaoConfig: 3,
    },
    localizacao:
      typeof salvo.localizacao === "string" && salvo.localizacao
        ? localPorId(salvo.localizacao).id
        : inicial.localizacao,
    convite: salvo.convite ?? null,
    reuniaoAtual: salvo.reuniaoAtual ?? null,
    sofiaNaCasa: typeof salvo.sofiaNaCasa === "boolean" ? salvo.sofiaNaCasa : null,
    chatsCEOs:
      typeof salvo.chatsCEOs === "object" && salvo.chatsCEOs !== null ? salvo.chatsCEOs : {},
  };
}

/** A Sofia decide sozinha se vai pra Greenwich. Chamar de novo é opcional. */
function comSofiaNaCasa(base: EstadoRP, forcar = false): EstadoRP {
  if (base.localizacao !== "casa") return base;
  if (!forcar && base.sofiaNaCasa !== null) return base;
  const decisao = decisaoSofiaCasa(base);
  const msg: MsgChat = {
    id: `casa-${Date.now()}`,
    de: "sofia",
    texto: decisao.linha,
    turno: base.turno,
    auto: true,
  };
  return {
    ...base,
    sofiaNaCasa: decisao.aceita,
    chatSofia: [...base.chatSofia, msg].slice(-200),
    naoLidas: { ...base.naoLidas, sofia: base.naoLidas.sofia + 1 },
  };
}

/** Convite novo, convite antigo preservado, ou cancelamento explícito. */
function conviteAposMensagem(texto: string, base: EstadoRP) {
  const proposta = detectarReuniao(texto, base);
  if (proposta) return proposta;
  if (/cancel|desmarc/i.test(texto)) return null;
  return base.convite;
}

function anexarRecado(estado: EstadoRP, agente: "sofia" | "axiom", texto: string): EstadoRP {
  const msg: MsgChat = {
    id: `auto-${agente}-${estado.turno}-${Date.now()}`,
    de: agente,
    texto,
    turno: estado.turno,
    auto: true,
  };
  return {
    ...estado,
    chatSofia: agente === "sofia" ? [...estado.chatSofia, msg].slice(-200) : estado.chatSofia,
    chatAxiom: agente === "axiom" ? [...estado.chatAxiom, msg].slice(-200) : estado.chatAxiom,
    naoLidas: {
      ...estado.naoLidas,
      [agente]: estado.naoLidas[agente] + 1,
    },
  };
}

function gerarComentarioSofia(est: EstadoRP, entrada: EntradaFeed): string | null {
  const d = entrada.delta;
  const r = rng((est.seed + est.turno * 101 + entrada.titulo.length * 13) >>> 0);
  if (Math.abs(d.caixa ?? 0) >= 1) {
    return sorteia(r, [
      `Ryan, você acabou de mover ${fmtUSD(Math.abs(d.caixa ?? 0))}. O balanço não perdoa amadorismo. Já pedi a nota fiscal pro compliance.`,
      `Menos ${fmtUSD(Math.abs(d.caixa ?? 0))} do caixa. Eu espero, pelo bem do nosso império e da nossa família, que essa aposta pague dividendos.`,
      `Eu vi a transferência de ${fmtUSD(Math.abs(d.caixa ?? 0))} passar na tela antes de você me avisar. A gente conversa a sós depois.`,
    ]);
  }
  if (Math.abs(d.caixa ?? 0) >= 0.5) {
    return sorteia(r, [
      `Saíram ${fmtUSD(Math.abs(d.caixa ?? 0))} da holding. Registrado na auditoria semanal.`,
      `Gasto de ${fmtUSD(Math.abs(d.caixa ?? 0))} aprovado no limite. Segura a caneta agora.`,
    ]);
  }
  if ((d.heat ?? 0) >= 6) {
    return sorteia(r, [
      `O compliance acabou de acender a luz vermelha. O heat subiu +${d.heat}. A imprensa tá batendo na recepção da torre.`,
      `Atenção com a mídia: heat subindo rápido (+${d.heat}). Já mandei o jurídico blindar os contratos de Greenwich.`,
    ]);
  }
  if (entrada.categoria === "ataque") {
    return sorteia(r, [
      "Golpe agressivo, Ryan. Mas se você puxou o gatilho, eu garanto a retaguarda contábil.",
      "Eles vão tentar retaliar. Eu já avisei os 12 bancos pra congelar qualquer tentativa de bloqueio.",
    ]);
  }
  return null;
}

interface ReacaoPendencia {
  de: string;
  canal: "axiom" | "sofia" | string;
  texto: string;
}

function verificarReacaoPendencia(entrada: EntradaFeed): ReacaoPendencia | null {
  const avancos = entrada.efeitos.filter((l) => l.startsWith("AVANÇO:"));
  if (avancos.length === 0) return null;
  const linha = avancos[0] ?? "";
  if (linha.includes("Maçã Podre") || linha.includes("apple")) {
    return {
      de: "Jeff Williams",
      canal: "foundries",
      texto:
        "Boss man, Jeff Williams aqui. A Cláusula 14.8 avançou mais um estágio. Tim Cook já sentiu o baque e Cupertino começou a ligar pro nosso jurídico.",
    };
  }
  if (linha.includes("Estates") || linha.includes("estates")) {
    return {
      de: "Helena Voss",
      canal: "investments",
      texto:
        "Ryan, Helena Voss. O projeto Estates avançou. Os sinais do próximo lote já estão caindo na tesouraria e Bel-Air tá sob controle.",
    };
  }
  if (linha.includes("Renascer") || linha.includes("renascer")) {
    return {
      de: "Sofia",
      canal: "sofia",
      texto:
        "Operação Renascer avançou. As famílias estão recebendo as escrituras e o programa virou trending global. Bati a conformidade de cada centavo.",
    };
  }
  if (linha.includes("governador") || linha.includes("PEC")) {
    return {
      de: "Ricardo Salles",
      canal: "axiom",
      texto:
        "Bancada Space comemorando: a PEC avançou mais um turno no Congresso. Os 27 governadores-student já estão a postos.",
    };
  }
  if (linha.includes("INDEX") || linha.includes("index")) {
    return {
      de: "Victor Vit",
      canal: "esports",
      texto:
        "Vit do Esports, boss man. O caso do INDEX avançou. A LCK tá em pânico com a nossa multa rescisória e ele tá focado na Space.",
    };
  }
  if (linha.includes("EWC") || linha.includes("ewc")) {
    return {
      de: "Coach kkooma",
      canal: "esports",
      texto:
        "Avanço no chaveamento do EWC! Análise dos adversários concluída. Vamos jogar pelo título mundial.",
    };
  }
  if (linha.includes("Muralha") || linha.includes("muralha")) {
    return {
      de: "Axiom",
      canal: "axiom",
      texto:
        "Muralha de Greenwich reforçada, boss man. Jammers atualizados num raio de 5km e drones da TMZ neutralizados.",
    };
  }
  return null;
}

export const useRP = create<LojaRP>((set, get) => ({
  estado: estadoInicial(),
  pensando: false,
  sofiaPensando: false,
  axiomPensando: false,
  geralPensando: false,
  iaErro: null,

  hidratar: () => {
    const salvo = carregar();
    if (!salvo) return;
    set({ estado: salvo });
  },

  enviar: async (acao: string) => {
    const texto = acao.trim();
    if (!texto || get().pensando) return;

    const base = get().estado;
    if (mesFechado(base.calendario)) return;
    const entrada = aplicar(base, texto); // números fechados aqui
    // tempo anda com a decisão: uma ordem custa uma semana do mês
    const calendario = proximaSemana(base.calendario) ?? base.calendario;
    entrada.data = formatarCalendario(calendario);
    set({ pensando: true });

    let final: EntradaFeed = entrada;
    if (base.config.habilitada) {
      const narrado = await narrarPorIA(
        base.config,
        { ...base, ...estadoCom(entrada, base), calendario },
        entrada,
        texto,
      );
      if (narrado) {
        final = { ...entrada, titulo: narrado.titulo, cena: narrado.cena, narradoPor: "ia" };
      }
    }

    const comentarioSofia = gerarComentarioSofia(base, entrada);
    if (comentarioSofia) {
      final = {
        ...final,
        cena: `${final.cena}\n\n💬 Sofia Mendes (CFO): "${comentarioSofia}"`,
      };
    }

    const reacao = verificarReacaoPendencia(entrada);

    let chatSofia = base.chatSofia;
    let chatAxiom = base.chatAxiom;
    const chatsCEOs = { ...base.chatsCEOs };
    const naoLidas = { ...base.naoLidas };

    if (comentarioSofia) {
      const msgS: MsgChat = {
        id: `s-feed-${Date.now()}`,
        de: "sofia",
        texto: `[Sobre "${final.titulo}"]: ${comentarioSofia}`,
        turno: base.turno,
        auto: true,
      };
      chatSofia = [...chatSofia, msgS].slice(-200);
      naoLidas.sofia += 1;
    }

    if (reacao) {
      if (reacao.canal === "sofia") {
        const msgS: MsgChat = {
          id: `s-pen-${Date.now()}`,
          de: "sofia",
          texto: reacao.texto,
          turno: base.turno,
          auto: true,
        };
        chatSofia = [...chatSofia, msgS].slice(-200);
        naoLidas.sofia += 1;
      } else if (reacao.canal === "axiom") {
        const msgA: MsgChat = {
          id: `a-pen-${Date.now()}`,
          de: "axiom",
          texto: `[${reacao.de}]: "${reacao.texto}"`,
          turno: base.turno,
          auto: true,
        };
        chatAxiom = [...chatAxiom, msgA].slice(-200);
        naoLidas.axiom += 1;
      } else {
        const hist = chatsCEOs[reacao.canal] ?? [];
        const msgC: MsgCEO = {
          id: `ceo-auto-${Date.now()}`,
          de: reacao.canal,
          texto: reacao.texto,
          turno: base.turno,
        };
        chatsCEOs[reacao.canal] = [...hist, msgC].slice(-100);
        const msgA: MsgChat = {
          id: `a-ceo-${Date.now()}`,
          de: "axiom",
          texto: `Aviso de ${reacao.de} (${reacao.canal}): "${reacao.texto}"`,
          turno: base.turno,
          auto: true,
        };
        chatAxiom = [...chatAxiom, msgA].slice(-200);
        naoLidas.axiom += 1;
      }
    }

    const novo: EstadoRP = {
      ...estadoCom(entrada, base),
      calendario,
      data: formatarCalendario(calendario),
      feed: [final, ...base.feed].slice(0, 200),
      seed: (base.seed + (base.turno + 1) * 2654435761) >>> 0,
      convite: conviteAposMensagem(texto, base),
      chatSofia,
      chatAxiom,
      chatsCEOs,
      naoLidas,
    };
    salvar(novo);
    set({ estado: novo, pensando: false });
  },

  /** Conversa pública com o Axiom no feed — o 130º todo ouve. Não gasta semana.
   *  Usa sempre a resposta local do Axiom (instantânea) para manter o feed fluido.
   *  O chat privado (modal) usa IA quando disponível. */
  conversar: (texto: string) => {
    const t = texto.trim();
    if (!t || get().pensando) return;

    const base = get().estado;
    if (mesFechado(base.calendario)) return;

    set({ pensando: true });

    // Salva mensagem do Ryan no chat privado do Axiom também (ele está presente)
    const msgRyan: MsgChat = {
      id: `pub-r-${Date.now()}`,
      de: "ryan",
      texto: t,
      turno: base.turno,
    };
    const comRyan = [...base.chatAxiom, msgRyan];

    // Resposta local — instantânea, sem chamada de rede no feed.
    // O chat privado já usa IA; o feed precisa ser fluido.
    const resposta = respostaLocalAxiom(base, t);

    const msgAxiom: MsgChat = {
      id: `pub-a-${Date.now()}`,
      de: "axiom",
      texto: resposta,
      turno: base.turno,
    };

    // Monta entrada de feed como cena de conversa (sem custar semana)
    const entradaConversa: EntradaFeed = {
      id: `conv-${base.turno}-${Date.now()}`,
      turno: base.turno,
      data: base.data,
      categoria: "acaoLivre",
      titulo: "No 130º",
      cena: `Ryan: "${t}"\n\nAxiom: "${resposta}"`,
      efeitos: [],
      delta: {},
      reacoes: { midia: "", mercado: "", povo: "" },
      escolhas: [],
      narradoPor: "engine",
    };

    const novo: EstadoRP = {
      ...base,
      chatAxiom: [...comRyan, msgAxiom].slice(-200),
      feed: [entradaConversa, ...base.feed].slice(0, 200),
      convite: conviteAposMensagem(t, base),
    };
    salvar(novo);
    set({ estado: novo, pensando: false });
  },

  /** Chat geral do 130º: Axiom responde no canal aberto, o império escuta e
   *  reage. Determinístico no impacto (heat/moral/aprovação/tensão/relações),
   *  IA quando ligada. Não gasta semana, não move caixa. */
  falarNoGeral: async (texto: string) => {
    const t = texto.trim();
    if (!t || get().geralPensando) return;

    const base = get().estado;
    if (mesFechado(base.calendario)) return;

    set({ geralPensando: true });

    const msgRyan: MsgGeral = {
      id: `g-r-${Date.now()}`,
      de: "ryan",
      texto: t,
      turno: base.turno,
    };
    const comRyan = [...base.chatGeral, msgRyan].slice(-300);
    // Persiste a fala na hora — o convite de reunião detectado no canal abre já.
    const inicial: EstadoRP = {
      ...base,
      chatGeral: comRyan,
      convite: conviteAposMensagem(t, base),
    };
    salvar(inicial);
    set({ estado: inicial });

    // Impacto determinístico da fala nos indicadores do império.
    const imp = impactoConversa(base, t);

    let resposta: string | null = null;
    let fonte: "ia" | "local" = "local";
    if (base.config.habilitada) {
      resposta = await responderGeralIA(base.config, inicial, comRyan, t);
      if (resposta) fonte = "ia";
    }
    if (!resposta) {
      resposta = respostaLocalGeral(inicial, t);
      // A falha precisa aparecer — o chat nunca pode fingir que é IA.
      // O `falha.erro` já vem com o prefixo "HTTP nnn —", não duplica.
      const falha = ultimaFalhaIA();
      set({ iaErro: falha ? falha.erro : null });
    } else {
      set({ iaErro: null });
    }

    const msgAxiom: MsgGeral = {
      id: `g-a-${Date.now()}`,
      de: "axiom",
      texto: resposta,
      turno: base.turno,
      fonte,
    };

    // Repercussão: o que foi dito ecoa nos chats privados de quem ouviu.
    const eco = repercussaoChat(inicial, t, imp);
    let chatSofia = inicial.chatSofia;
    let chatAxiom = inicial.chatAxiom;
    const chatsCEOs = { ...inicial.chatsCEOs };
    const naoLidas = { ...inicial.naoLidas };
    const extras: MsgGeral[] = [];
    for (const r of eco) {
      const linha: MsgGeral = {
        id: `g-eco-${r.canal}-${Date.now()}-${extras.length}`,
        de: r.de,
        texto: r.texto,
        turno: base.turno,
        auto: true,
      };
      extras.push(linha);
      if (r.canal === "sofia") {
        const ecoSofia: MsgChat = {
          id: `s-eco-${Date.now()}-${extras.length}`,
          de: "sofia",
          texto: r.texto,
          turno: base.turno,
          auto: true,
        };
        chatSofia = [...chatSofia, ecoSofia].slice(-200);
        naoLidas.sofia += 1;
      } else if (r.canal === "axiom") {
        const ecoAxiom: MsgChat = {
          id: `a-eco-${Date.now()}-${extras.length}`,
          de: "axiom",
          texto: r.texto,
          turno: base.turno,
          auto: true,
        };
        chatAxiom = [...chatAxiom, ecoAxiom].slice(-200);
        naoLidas.axiom += 1;
      } else {
        chatsCEOs[r.canal] = [
          ...(chatsCEOs[r.canal] ?? []),
          {
            id: `ceo-eco-${Date.now()}-${extras.length}`,
            de: r.de,
            texto: r.texto,
            turno: base.turno,
          },
        ].slice(-100);
      }
    }

    // O impacto é pequeno por fala; só vira manchete quando é grande.
    let feed = inicial.feed;
    if (imp.peso >= 5) {
      const entrada: EntradaFeed = {
        id: `g-feed-${Date.now()}`,
        turno: base.turno,
        data: base.data,
        categoria: "midia",
        titulo: "O que foi dito no 130º vazou",
        cena: `Ryan: "${t}"\n\nAxiom: "${resposta}"\n\nO canal aberto da torre transformou a conversa em assunto do império.`,
        efeitos: imp.chips,
        delta: { heat: imp.heat, moral: imp.moral, aprovacao: imp.aprovacao },
        reacoes: {
          midia:
            imp.heat > 0
              ? "MR Times pega a fala como manchete da noite."
              : "Tom positivo na imprensa plantada.",
          mercado: "Investidores leem o canal como sinal de direção.",
          povo:
            imp.aprovacao >= 0
              ? "Aprovação reage bem ao tom direto."
              : "Redes criticam a arrogância no ar.",
        },
        escolhas: [],
        narradoPor: "engine",
      };
      feed = [entrada, ...inicial.feed].slice(0, 200);
    }

    const comTodos = [
      // Os chips de impacto ficam na fala do Ryan — o que ELE disse moveu o império.
      ...comRyan.map((m) =>
        m.id === msgRyan.id && imp.chips.length > 0 ? { ...m, chips: imp.chips } : m,
      ),
      msgAxiom,
      ...extras,
    ].slice(-300);
    const comImpacto = aplicarImpacto(inicial, imp);
    const novo: EstadoRP = {
      ...comImpacto,
      chatGeral: comTodos,
      feed,
      chatSofia,
      chatAxiom,
      chatsCEOs,
      naoLidas,
      convite: conviteAposMensagem(t, inicial),
    };
    salvar(novo);
    set({ estado: novo, geralPensando: false });
  },

  avancarSemana: async (rapido = false) => {
    const base = get().estado;
    if (mesFechado(base.calendario)) return "mes";
    if (get().pensando) return "ocupado";

    set({ pensando: true });
    let eventos = eventosLocais(base);
    if (base.config.habilitada) {
      const daIA = await gerarEventosIA(base.config, base);
      if (daIA) eventos = daIA;
    }
    const resultado = avancarSemanaComEventos(base, eventos);
    if (!resultado) {
      set({ pensando: false });
      return "mes";
    }
    let novo = resultado.estado;
    salvar(novo);
    set({ estado: novo });

    // vida própria: de vez em quando Sofia ou Axiom manda mensagem sem ser chamado
    const sorte = rng((novo.seed ^ (novo.turno * 7919)) >>> 0)();
    if (sorte < 0.42) {
      const tema = eventos[0]?.faccao;
      const agente: "sofia" | "axiom" =
        tema === "familia" || tema === "conselho" || tema === "trabalho" ? "sofia" : "axiom";
      let texto = recadoLocal(novo, agente);
      if (!rapido && base.config.habilitada) {
        const daIA = await recadoAutoIA(base.config, novo, agente);
        if (daIA) texto = daIA;
      }
      novo = anexarRecado(get().estado, agente, texto);
      salvar(novo);
      set({ estado: novo });
    }

    set({ pensando: false });
    return "ok";
  },

  fecharMes: (diretrizId: string, abertura?: string) => {
    const base = get().estado;
    if (!mesFechado(base.calendario)) return false;

    const { estado: semChats, relatorio } = fecharMesLocal(base, diretrizId, abertura);
    const msgSofia: MsgChat = {
      id: `s-fech-${Date.now()}`,
      de: "sofia",
      texto: `Mês fechado: ${fmtUSD(relatorio.receita)} de receita, ${fmtUSD(relatorio.lucro)} de lucro e ${fmtUSD(relatorio.dividendos)} de dividendo. Diretriz aprovada: ${relatorio.diretriz}. Semana que vem eu quero o plano de execução na mesa — com nota fiscal.`,
      turno: semChats.turno,
    };
    const msgAxiom: MsgChat = {
      id: `a-fech-${Date.now()}`,
      de: "axiom",
      texto: `Boss man, mês virou. Caixa em ${fmtUSD(semChats.caixa)}. O conselho saiu da sala mas os conflitos continuam na porta. Eu já tô com o plano de execução na mão — só assina.`,
      turno: semChats.turno,
    };
    const novo: EstadoRP = {
      ...semChats,
      chatSofia: [...semChats.chatSofia, msgSofia].slice(-200),
      chatAxiom: [...semChats.chatAxiom, msgAxiom].slice(-200),
      naoLidas: { sofia: semChats.naoLidas.sofia + 1, axiom: semChats.naoLidas.axiom + 1 },
    };
    salvar(novo);
    set({ estado: novo });
    return true;
  },

  falarComSofia: async (texto: string) => {
    const t = texto.trim();
    if (!t || get().sofiaPensando) return;

    const base = get().estado;
    const convite = conviteAposMensagem(t, base);
    const msgRyan: MsgChat = {
      id: `r-${Date.now()}`,
      de: "ryan",
      texto: t,
      turno: base.turno,
    };
    const comRyan = [...base.chatSofia, msgRyan];
    const inicial: EstadoRP = { ...base, chatSofia: comRyan, convite };
    salvar(inicial);
    set({ estado: inicial, sofiaPensando: true });

    // o que o Sam falou mexe no humor dela — determinístico, igual pros dois modos
    const d = deltaSofia(t);
    const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
    const sofiaNovo = {
      estresse: clamp(base.sofia.estresse + d.estresse),
      energia: clamp(base.sofia.energia + d.energia),
    };
    const baseComHumor: EstadoRP = { ...base, sofia: sofiaNovo, chatSofia: comRyan };

    let resposta: string | null = null;
    let fonte: "ia" | "local" = "local";
    if (base.config.habilitada) {
      resposta = await responderSofiaIA(base.config, baseComHumor, comRyan, t);
      if (resposta) fonte = "ia";
    }
    if (!resposta) {
      resposta = respostaLocalSofia(baseComHumor, t);
      // A falha aparece — o chat nunca pode fingir que é IA.
      const falha = ultimaFalhaIA();
      set({ iaErro: falha ? falha.erro : null });
    } else {
      set({ iaErro: null });
    }

    const msgSofia: MsgChat = {
      id: `s-${Date.now()}`,
      de: "sofia",
      texto: resposta,
      turno: base.turno,
      fonte,
    };
    const atual = get().estado;
    const novo: EstadoRP = {
      ...atual,
      sofia: sofiaNovo,
      chatSofia: [...atual.chatSofia, msgSofia].slice(-200),
    };
    salvar(novo);
    set({ estado: novo, sofiaPensando: false });
  },

  falarComAxiom: async (texto: string) => {
    const t = texto.trim();
    if (!t || get().axiomPensando) return;

    const base = get().estado;
    const convite = conviteAposMensagem(t, base);
    const msgRyan: MsgChat = {
      id: `ra-${Date.now()}`,
      de: "ryan",
      texto: t,
      turno: base.turno,
    };
    const comRyan = [...base.chatAxiom, msgRyan];
    const inicial: EstadoRP = { ...base, chatAxiom: comRyan, convite };
    salvar(inicial);
    set({ estado: inicial, axiomPensando: true });

    let resposta: string | null = null;
    let fonte: "ia" | "local" = "local";
    if (base.config.habilitada) {
      resposta = await responderAxiomIA(base.config, { ...base, chatAxiom: comRyan }, comRyan, t);
      if (resposta) fonte = "ia";
    }
    if (!resposta) {
      resposta = respostaLocalAxiom(base, t);
      // A falha aparece — o chat nunca pode fingir que é IA.
      const falha = ultimaFalhaIA();
      set({ iaErro: falha ? falha.erro : null });
    } else {
      set({ iaErro: null });
    }

    const msgAxiom: MsgChat = {
      id: `a-${Date.now()}`,
      de: "axiom",
      texto: resposta,
      turno: base.turno,
      fonte,
    };
    const atual = get().estado;
    const novo: EstadoRP = {
      ...atual,
      chatAxiom: [...atual.chatAxiom, msgAxiom].slice(-200),
    };
    salvar(novo);
    set({ estado: novo, axiomPensando: false });
  },

  falarComCEO: (divisaoId: string, texto: string) => {
    const t = texto.trim();
    if (!t) return;
    const base = get().estado;
    const perfil = perfilPorId(divisaoId);
    if (!perfil) return;

    const ceoChat = base.chatsCEOs[divisaoId] ?? [];
    const msgRyan: MsgCEO = {
      id: `ceo-r-${Date.now()}`,
      de: "ryan",
      texto: t,
      turno: base.turno,
    };
    const resposta = respostaCEO(base, divisaoId, t);
    const msgCEO: MsgCEO = {
      id: `ceo-${divisaoId}-${Date.now()}`,
      de: divisaoId,
      texto: resposta,
      turno: base.turno,
    };
    const novo: EstadoRP = {
      ...base,
      chatsCEOs: {
        ...base.chatsCEOs,
        [divisaoId]: [...ceoChat, msgRyan, msgCEO].slice(-100),
      },
    };
    salvar(novo);
    set({ estado: novo });
  },

  marcarLidas: (quem) => {
    const estado = get().estado;
    if (estado.naoLidas[quem] === 0) return;
    const novo = { ...estado, naoLidas: { ...estado.naoLidas, [quem]: 0 } };
    salvar(novo);
    set({ estado: novo });
  },

  dispensarConvite: () => {
    const base = get().estado;
    if (!base.convite) return;
    const novo = { ...base, convite: null };
    salvar(novo);
    set({ estado: novo });
  },

  viajarPara: (destinoId, veiculoId) => {
    const base = get().estado;
    if (destinoId === base.localizacao) return false;
    const origem = localPorId(base.localizacao);
    const destino = localPorId(destinoId);
    const opcao = opcoesViagem(origem, destino).find((o) => o.id === veiculoId);
    if (!opcao?.dentro) return false;

    const convite = base.convite;
    const chegaNaReuniao = !!convite && convite.localId === destino.id;
    let novo: EstadoRP = {
      ...base,
      localizacao: destino.id,
      convite: chegaNaReuniao ? null : base.convite,
      reuniaoAtual: chegaNaReuniao ? convite : null,
      sofiaNaCasa: destino.id === "casa" ? null : base.sofiaNaCasa,
    };
    if (destino.id === "casa") novo = comSofiaNaCasa(novo);
    salvar(novo);
    set({ estado: novo });
    return true;
  },

  entrarNaReuniao: () => {
    const base = get().estado;
    const convite = base.convite;
    if (!convite || convite.localId !== base.localizacao) return false;
    const novo: EstadoRP = { ...base, convite: null, reuniaoAtual: convite };
    salvar(novo);
    set({ estado: novo });
    return true;
  },

  encerrarReuniao: () => {
    const base = get().estado;
    const reuniao = base.reuniaoAtual;
    if (!reuniao) return;
    const local = localPorId(reuniao.localId);
    const msg: MsgChat = {
      id: `ata-${Date.now()}`,
      de: "axiom",
      texto: `Ata registrada: ${reuniao.titulo}, ${local.nome}. Pauta fechada com ${reuniao.participantes.join(", ")}. Nenhum número foi movido sem a engine — o que ficou combinado entra na próxima semana.`,
      turno: base.turno,
    };
    const novo: EstadoRP = {
      ...base,
      reuniaoAtual: null,
      chatAxiom: [...base.chatAxiom, msg].slice(-200),
    };
    salvar(novo);
    set({ estado: novo });
  },

  convidarSofiaCasa: (forcar = false) => {
    const base = get().estado;
    if (base.localizacao !== "casa") return;
    const novo = comSofiaNaCasa(base, forcar);
    if (novo === base) return;
    salvar(novo);
    set({ estado: novo });
  },

  ajustarConfig: (c) => {
    const estado = {
      ...get().estado,
      config: {
        ...get().estado.config,
        ...c,
        modelos: { ...get().estado.config.modelos, ...(c.modelos ?? {}) },
      },
    };
    salvar(estado);
    set({ estado });
  },

  ajustarModelo: (chave, valor) => {
    const estado = {
      ...get().estado,
      config: {
        ...get().estado.config,
        modelos: { ...get().estado.config.modelos, [chave]: valor },
      },
    };
    salvar(estado);
    set({ estado });
  },

  resetar: () => {
    const estado = estadoInicial();
    salvar(estado);
    set({ estado });
  },

  exportar: () => {
    const estado = get().estado;
    const blob = new Blob([JSON.stringify(estado, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `space-rp-${estado.calendario.ano}-${estado.calendario.mes}-sem${estado.calendario.semana}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importar: (json: string) => {
    try {
      const parsed = JSON.parse(json) as EstadoRP;
      if (typeof parsed.turno !== "number" || !Array.isArray(parsed.feed)) return false;
      const estado = normalizar(parsed);
      salvar(estado);
      set({ estado });
      return true;
    } catch {
      return false;
    }
  },
}));

/** O estado que a engine acabou de produzir a partir do feed[0]. */
function estadoCom(entrada: EntradaFeed, est: EstadoRP): EstadoRP {
  const d = entrada.delta;
  const clamp = (v: number) => Math.max(0, Math.min(100, v));
  const rel = { ...est.relacoes };
  if (d.relacoes) {
    for (const [k, v] of Object.entries(d.relacoes)) {
      rel[k] = Math.max(-100, Math.min(100, (rel[k] ?? 50) + v));
    }
  }
  return {
    ...est,
    turno: entrada.turno,
    data: entrada.data,
    caixa: Math.max(0, est.caixa + (d.caixa ?? 0)),
    pessoal: Math.max(0, est.pessoal + (d.pessoal ?? 0)),
    coin: Math.max(1, +(est.coin + (d.coin ?? 0)).toFixed(2)),
    holding: Math.max(0, est.holding + (d.holding ?? 0)),
    cartao: Math.max(
      0,
      Math.min(
        LIMITE_CARTAO,
        est.cartao +
          0.05 -
          (entrada.categoria === "gasto" ||
          entrada.categoria === "familia" ||
          entrada.categoria === "caridade"
            ? Math.max(0, -(d.caixa ?? 0))
            : 0),
      ),
    ),
    heat: clamp(est.heat + (d.heat ?? 0)),
    moral: clamp(est.moral + (d.moral ?? 0)),
    aprovacao: clamp(est.aprovacao + (d.aprovacao ?? 0)),
    relacoes: rel,
    pendencias: entrada.efeitos.some((l) => l.startsWith("AVANÇO:"))
      ? avancarPendencias(est, entrada)
      : est.pendencias,
  };
}

function avancarPendencias(est: EstadoRP, entrada: EntradaFeed) {
  const avancos = entrada.efeitos.filter((l) => l.startsWith("AVANÇO:"));
  return est.pendencias.map((p) => {
    const linha = avancos.find((l) => l.includes(`[${p.nome}]`));
    if (!linha || !p.ativa) return p;
    const passo = Math.min(p.passo + 1, p.etapas.length - 1);
    const concluida = p.passo === passo;
    return { ...p, passo, ativa: !(concluida && passo === p.etapas.length - 1) };
  });
}
