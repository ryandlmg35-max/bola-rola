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

export interface Divisao {
  id: string;
  nome: string;
  nota: string;
}

export interface ConfigIA {
  habilitada: boolean;
  baseUrl: string;
  apiKey: string;
  modelo: string;
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
  config: ConfigIA;
}
