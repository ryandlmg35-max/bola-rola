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

export interface ConfigIA {
  habilitada: boolean;
  baseUrl: string;
  apiKey: string;
  modelo: string;
}

export interface MsgChat {
  id: string;
  de: "ryan" | "sofia";
  texto: string;
  turno: number;
}

export interface SofiaStatus {
  /** 0..100 — sobe com gasto/crise/auditoria, desce com família e carinho. */
  estresse: number;
  /** 0..100 — energia sexual: sobe com flerte, cai com cobrança e sono. */
  energia: number;
}

export interface EstadoRP {
  turno: number;
  data: string;
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
  sofia: SofiaStatus;
  config: ConfigIA;
}
