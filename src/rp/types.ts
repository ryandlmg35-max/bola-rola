export type Categoria =
  | "gasto"
  | "investimento"
  | "contratacao"
  | "politica"
  | "familia"
  | "ataque"
  | "midia"
  | "esports"
  | "seguranca"
  | "caridade"
  | "acaoLivre";

/** Delta numérico aplicado pela engine. Caixa/holding/pessoal em bilhões USD. */
export interface Efeitos {
  caixa?: number;
  pessoal?: number;
  coin?: number;
  holding?: number;
  heat?: number;
  moral?: number;
  aprovacao?: number;
  relacoes?: Record<string, number>;
}

export interface Reacoes {
  midia: string;
  mercado: string;
  povo: string;
}

export interface Escolha {
  rotulo: string;
  categoria: Categoria;
  detalhe?: string;
}

export interface EntradaFeed {
  id: string;
  turno: number;
  data: string;
  categoria: Categoria;
  titulo: string;
  cena: string;
  efeitos: string[];
  delta: Efeitos;
  reacoes: Reacoes;
  escolhas: Escolha[];
  narradoPor: "engine" | "ia";
}

export interface Pendencia {
  id: string;
  nome: string;
  descricao: string;
  gatilhos: string[];
  passo: number;
  etapas: string[];
  ativa: boolean;
}

export type StatusDiv =
  "estavel" | "crescendo" | "prejuizo" | "instavel" | "geladeira" | "congelada" | "operando";

export interface Divisao {
  id: string;
  nome: string;
  ceo: string;
  /** País sede com bandeira. */
  pais: string;
  /** Receita por mês (string formatada, "—" se não informada no RP). */
  receita: string;
  /** Lucro por mês (string formatada; começa com "-" se prejuízo). */
  lucro: string;
  status: StatusDiv;
  /** Uma linha de contexto — pendência principal da divisão. */
  nota: string;
}

export type ProvedorIA = "nvidia" | "custom";

/** Um modelo por função: o mundo não usa o mesmo cérebro do conselho. */
export interface ModelosIA {
  /** Reescrita da cena do turno (rápido). */
  narrador: string;
  /** Eventos autônomos da semana — o motor do mundo. */
  mundo: string;
  /** Chat da Sofia (CFO). */
  sofia: string;
  /** Chat do Axiom (chief of staff). */
  axiom: string;
  /** Reunião de fechamento de mês. */
  conselho: string;
}

export interface ConfigIA {
  habilitada: boolean;
  provedor: ProvedorIA;
  baseUrl: string;
  apiKey: string;
  modelos: ModelosIA;
  /** Versão do schema de configuração; saves antigos migram modelos/chave. */
  versaoConfig?: number;
}

export interface MsgChat {
  id: string;
  de: "ryan" | "sofia" | "axiom";
  texto: string;
  turno: number;
  /** Mensagem que chegou sozinha (o mundo andou sem o Ryan). */
  auto?: boolean;
}

/** Mensagem do chat geral do 130º — canal aberto, todo mundo ouve. */
export interface MsgGeral {
  id: string;
  de: "ryan" | "axiom" | "sofia" | string;
  texto: string;
  turno: number;
  /** Repercussão automática (outro personagem reagindo ao que foi dito). */
  auto?: boolean;
  /** Chips de impacto exibidos sob a fala do Ryan ("aprovação +2"). */
  chips?: string[];
  /** Quem escreveu de verdade: IA ou motor local. Nunca esconder isso. */
  fonte?: "ia" | "local";
}

/** Reunião detectada no chat ou na ordem livre. */
export interface ConviteReuniao {
  id: string;
  titulo: string;
  /** id da sede, "tower" (base) ou "casa". */
  localId: string;
  origemId: string;
  participantes: string[];
  quando: string;
  criadoTurno: number;
  fonte: "local" | "ia";
}

/** Calendário do RP: 4 semanas por mês, 1 turno = 1 semana. */
export interface Calendario {
  ano: number;
  mes: number;
  semana: number;
}

export interface Conflito {
  id: string;
  entre: string;
  sobre: string;
  /** 0..100 — quanto maior, mais perto de rachar o conselho. */
  nivel: number;
  desde: number;
}

export interface Mundo {
  /** 0..100 — tensão do conselho/executivos. Alimenta conflitos e custos. */
  tensao: number;
  conflitos: Conflito[];
  /** Última leitura de clima feita pelo motor ("calmo", "convulsão"...). */
  clima: string;
  /** Manchetes internas da última semana (contexto pra IA e pros chats). */
  ultimaSemana: string[];
}

export interface PlanoMes {
  diretriz: string;
  receitaMult: number;
  lucroMult: number;
  mesRef: string;
}

export interface RelatorioMes {
  ano: number;
  mes: number;
  receita: number;
  lucro: number;
  caixaAntes: number;
  caixaDepois: number;
  dividendos: number;
  diretriz: string;
}

export interface SofiaStatus {
  /** 0..100 — sobe com gasto/crise/auditoria, desce com família e carinho. */
  estresse: number;
  /** 0..100 — energia sexual: sobe com flerte, cai com cobrança e sono. */
  energia: number;
}

export interface MsgCEO {
  id: string;
  de: "ryan" | string; // "ryan" ou nome do CEO
  texto: string;
  turno: number;
}

export interface EstadoRP {
  turno: number;
  data: string;
  calendario: Calendario;
  seed: number;
  caixa: number;
  pessoal: number;
  coin: number;
  holding: number;
  /** Cartão corporativo: limite $500mi/mês, disponível por turno (bilhões USD). */
  cartao: number;
  heat: number;
  moral: number;
  aprovacao: number;
  relacoes: Record<string, number>;
  divisoes: Divisao[];
  pendencias: Pendencia[];
  feed: EntradaFeed[];
  chatSofia: MsgChat[];
  chatAxiom: MsgChat[];
  /** Chat geral do 130º: fala com o Axiom, o império inteiro ouve e reage. */
  chatGeral: MsgGeral[];
  sofia: SofiaStatus;
  mundo: Mundo;
  plano: PlanoMes;
  ultimoRelatorio: RelatorioMes | null;
  naoLidas: { sofia: number; axiom: number };
  config: ConfigIA;
  /** Onde o Ryan está agora: "tower", "casa" ou id de uma sede. */
  localizacao: string;
  /** Reunião detectada, aguardando o Ryan decidir ir. */
  convite: ConviteReuniao | null;
  /** Reunião em andamento na sede de destino. */
  reuniaoAtual: ConviteReuniao | null;
  /** null = ainda não chamou; true/false = resposta da Sofia nesta visita. */
  sofiaNaCasa: boolean | null;
  /** Chats com os CEOs das divisões — keyed por divisao.id. */
  chatsCEOs: Record<string, MsgCEO[]>;
}
