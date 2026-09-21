export type Posicao = "GOL" | "ZAG" | "LAT" | "VOL" | "MEI" | "ATA";

export interface Jogador {
  id: string;
  nome: string;
  posicao: Posicao;
  nota: number; // 0-100 (sintética, gerada pelo simulador)
}

export interface Clube {
  id: string;
  nome: string;
  abrev: string;
  pais: string;
  cor: string;
  notaBase: number;
  elenco: Jogador[];
  historico: HistoricoItem[];
}

export interface HistoricoItem {
  temporada: number;
  competicao: string;
  divisao: string;
  posicao: number;
}

export interface Partida {
  id: string;
  fase: string; // "Rodada" | "Quadrangular A" | "Oitavas" ...
  rodada: number;
  casa: string;
  fora: string;
  golsCasa: number | null;
  golsFora: number | null;
  modo?: ModoSimulacao;
  penaltisCasa?: number;
  penaltisFora?: number;
}

export type ModoSimulacao = "nota" | "aleatorio";

export type TipoCompeticao = "liga" | "liga-c" | "mata-mata" | "suico" | "grupos";

export type Regiao = "brasil" | "europa" | "internacional";

export interface ZonaTabela {
  ate: number;
  desde?: number;
  rotulo: string;
  classe: string;
}

export interface Etapa {
  id: string;
  nome: string;
  partidas: Partida[];
  gruposIds?: Record<string, string[]>; // grupo -> clubes
  concluida: boolean;
}

export interface Competicao {
  id: string;
  nome: string;
  regiao: Regiao;
  tipo: TipoCompeticao;
  temporada: number;
  clubes: string[];
  etapas: Etapa[];
  campeao?: string;
  classificacaoFinal?: string[];
  zonas: ZonaTabela[];
  observacao: string;
  implementado: "completo" | "simplificado";
}

export interface LinhaTabela {
  clubeId: string;
  pontos: number;
  jogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  golsPro: number;
  golsContra: number;
  saldo: number;
}
