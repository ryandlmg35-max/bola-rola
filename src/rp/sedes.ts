/**
 * Sedes das divisões — endereço, coordenadas no globo e quadro de funcionários.
 * As coordenadas alimentam o mapa 3D (MapaSedes.tsx); o quadro é a fonte
 * única do total de funcionários (somado em código, nunca diverge).
 *
 * Imagens: /sedes/*.jpg no public/ (ver README.txt da pasta).
 */

export interface QuadroItem {
  cargo: string;
  qtd: number;
}

export interface Sede {
  /** id da divisão no catálogo, ou "tower" pra sede principal. */
  id: string;
  nome: string;
  cidade: string;
  pais: string;
  lat: number;
  lon: number;
  /** Caminho em public/ — opcional; sem foto mostra placeholder. */
  imagem?: string;
  /** Uma linha de flavor sobre a sede. */
  destaque: string;
  quadro: QuadroItem[];
}

export const SEDES: Sede[] = [
  {
    id: "tower",
    nome: "Space Group Tower",
    cidade: "Nova York",
    pais: "🇺🇸 EUA",
    lat: 40.7128,
    lon: -74.006,
    imagem: "/sedes/torre-ny.jpg",
    destaque:
      "Sede principal do império — 130 andares em Manhattan, escritório do Ryan no topo e a bandeira da águia de três estrelas voando no mastro.",
    quadro: [
      { cargo: "Diretoria & C-level", qtd: 22 },
      { cargo: "Jurídico & compliance", qtd: 180 },
      { cargo: "Assistentes & admin CLT", qtd: 1240 },
      { cargo: "Engenharia de plataforma & dados", qtd: 860 },
      { cargo: "Segurança & facilities", qtd: 520 },
      { cargo: "Comunicação & imprensa", qtd: 148 },
    ],
  },
  {
    id: "media",
    nome: "Space Media — Hollywood",
    cidade: "Los Angeles",
    pais: "🇺🇸 EUA",
    lat: 34.0522,
    lon: -118.2437,
    imagem: "/sedes/la.jpg",
    destaque:
      "Complexo de estúdios Film & Series Division — produção, pós-produção, distribuição e o talento sob o mesmo teto, com a downtown LA de fundo.",
    quadro: [
      { cargo: "Diretoria & C-level", qtd: 24 },
      { cargo: "Produtores & criativos", qtd: 1860 },
      { cargo: "Pós-produção & estúdios", qtd: 2240 },
      { cargo: "Jurídico & direitos autorais", qtd: 420 },
      { cargo: "Comercial & distribuição", qtd: 680 },
      { cargo: "Operações & manutenção de estúdio", qtd: 520 },
    ],
  },
  {
    id: "tech",
    nome: "Space Tech Campus",
    cidade: "Menlo Park",
    pais: "🇺🇸 EUA",
    lat: 37.453,
    lon: -122.1817,
    destaque:
      "Campus de comunicação — o Instagram e o WhatsApp saem daqui, e os $4bi de data centers ainda tão em aprovação.",
    quadro: [
      { cargo: "Engenharia & produto", qtd: 3400 },
      { cargo: "Infra & data centers", qtd: 920 },
      { cargo: "Comercial & anúncios", qtd: 760 },
      { cargo: "Jurídico & policy", qtd: 380 },
      { cargo: "Administrativo CLT", qtd: 480 },
    ],
  },
  {
    id: "sports",
    nome: "Space Sports HQ",
    cidade: "Dallas",
    pais: "🇺🇸 EUA",
    lat: 32.7767,
    lon: -96.797,
    destaque:
      "Base administrativa das três franquias — Cowboys, Arsenal e Grizzlies. O Marcus Webb pede $300mi de reforço daqui.",
    quadro: [
      { cargo: "Jogadores & comissão (3 franquias)", qtd: 150 },
      { cargo: "Médico & desempenho", qtd: 90 },
      { cargo: "Scouts & base de categorias", qtd: 120 },
      { cargo: "Bilheteria & estádio CLT", qtd: 640 },
      { cargo: "Jurídico & contratos", qtd: 60 },
    ],
  },
  {
    id: "esports",
    nome: "Space Esports Arena",
    cidade: "São Paulo",
    pais: "🇧🇷 Brasil",
    lat: -23.5505,
    lon: -46.6333,
    destaque:
      "Sede operacional dos heptas campeões — rosters, transmissão e o bootcamp que forma os títulos.",
    quadro: [
      { cargo: "Jogadores & comissão técnica", qtd: 95 },
      { cargo: "Staff de organização & marketing", qtd: 120 },
      { cargo: "Produção de transmissão", qtd: 85 },
      { cargo: "Administração CLT", qtd: 40 },
      { cargo: "Jurídico & contratos", qtd: 18 },
    ],
  },
  {
    id: "consumer",
    nome: "Space Consumer — Indústria",
    cidade: "São Paulo",
    pais: "🇧🇷 Brasil",
    lat: -23.5789,
    lon: -46.6076,
    destaque:
      "Fábricas e varejo — a linha Apex com fila de 90 dias, chocolate Space e tênis Space pelo decreto.",
    quadro: [
      { cargo: "Operação de fábrica CLT", qtd: 8400 },
      { cargo: "Varejo & lojas próprias", qtd: 1150 },
      { cargo: "Logística & distribuição", qtd: 980 },
      { cargo: "Engenharia & qualidade", qtd: 720 },
      { cargo: "Jurídico & conformidade", qtd: 140 },
    ],
  },
  {
    id: "interactive",
    nome: "Space Interactive Studio",
    cidade: "Kyoto",
    pais: "🇯🇵 Japão",
    lat: 35.0116,
    lon: 135.7681,
    destaque:
      "Estúdio de jogos do Celo Tavares — o universo do INDEX vira gameplay, 4 milhões em pré-venda.",
    quadro: [
      { cargo: "Game design & desenvolvimento", qtd: 420 },
      { cargo: "Arte & áudio", qtd: 160 },
      { cargo: "Live ops & suporte", qtd: 95 },
      { cargo: "Publicidade & parcerias", qtd: 55 },
      { cargo: "Jurídico & IP", qtd: 30 },
    ],
  },
  {
    id: "ventures",
    nome: "Space Ventures & Lifestyle",
    cidade: "São Paulo",
    pais: "🇧🇷 Brasil",
    lat: -23.5614,
    lon: -46.6559,
    destaque: "TV, moda e marcas — o SBT +18% de audiência e a Space Fashion sob o mesmo teto.",
    quadro: [
      { cargo: "Produção de TV (SBT)", qtd: 280 },
      { cargo: "Vestiário & fashion", qtd: 95 },
      { cargo: "Marcas & licensing", qtd: 60 },
      { cargo: "Administração CLT", qtd: 70 },
      { cargo: "Jurídico", qtd: 35 },
    ],
  },
  {
    id: "ai",
    nome: "Space AI Lab",
    cidade: "Austin",
    pais: "🇺🇸 EUA",
    lat: 30.2672,
    lon: -97.7431,
    destaque:
      "Laboratório do Musk — os modelos da Space nascem aqui, em fase pré-receita de $400mi/mês projetados.",
    quadro: [
      { cargo: "Pesquisadores de IA", qtd: 210 },
      { cargo: "Infraestrutura & data centers", qtd: 90 },
      { cargo: "Produto & platform", qtd: 52 },
      { cargo: "Jurídico & segurança de dados", qtd: 28 },
    ],
  },
  {
    id: "investments",
    nome: "Space Investments — Wall Street",
    cidade: "Nova York",
    pais: "🇺🇸 EUA",
    lat: 40.7069,
    lon: -74.0113,
    destaque:
      "Torre financeira a cinco quarteirões da sede — a Helena Voss comanda $3,2bi/mês de receita com margem de 88%.",
    quadro: [
      { cargo: "Analistas & gestores", qtd: 85 },
      { cargo: "Risco & compliance", qtd: 42 },
      { cargo: "Operações & back office", qtd: 45 },
      { cargo: "Jurídico", qtd: 18 },
    ],
  },
  {
    id: "foundries",
    nome: "Space Foundries — Linha Apple",
    cidade: "Cupertino",
    pais: "🇺🇸 EUA",
    lat: 37.323,
    lon: -122.0322,
    destaque:
      "Fábrica de iPhone com chip Space embutido — $350mi/dia rodando, gatilho da 14.8 guardado na geladeira por ordem do Ryan.",
    quadro: [
      { cargo: "Linha de montagem CLT", qtd: 2100 },
      { cargo: "Engenharia industrial", qtd: 240 },
      { cargo: "Logística", qtd: 300 },
      { cargo: "Qualidade & laboratório", qtd: 120 },
      { cargo: "Jurídico & ambiental", qtd: 40 },
    ],
  },
  {
    id: "ocean",
    nome: "Space Ocean Research Center",
    cidade: "Ilhabela",
    pais: "🇧🇷 Brasil",
    lat: -23.7764,
    lon: -46.3153,
    imagem: "/sedes/ocean.jpg",
    destaque:
      "Centro de pesquisa oceânica na Ilhabela — frota de ROVs, navio-mãe, piscinas de teste e jardins marinhos. Herdeira da NOAA.",
    quadro: [
      { cargo: "Cientistas & pesquisadores marítimos", qtd: 48 },
      { cargo: "Operadores de ROV & frota", qtd: 32 },
      { cargo: "Engenharia de submarinos", qtd: 22 },
      { cargo: "Jurídico & ambiental", qtd: 8 },
      { cargo: "Admin & segurança", qtd: 10 },
    ],
  },
  {
    id: "estates",
    nome: "Space Estates — Ateliê",
    cidade: "São Paulo",
    pais: "🇧🇷 Brasil",
    lat: -23.5853,
    lon: -46.6578,
    destaque:
      "Ateliê dos seis projetos — Bel-Air, Mônaco, Dubai, Mayfair, SP e Rio. Obras congeladas até o lucro fechar.",
    quadro: [
      { cargo: "Engenharia de obra", qtd: 46 },
      { cargo: "Arquitetura & projeto", qtd: 34 },
      { cargo: "Comercial & vendas", qtd: 28 },
      { cargo: "Jurídico & registros", qtd: 12 },
    ],
  },
  {
    id: "ilha",
    nome: "Ilha MR — Resort Complex",
    cidade: "Nassau",
    pais: "🇧🇸 Bahamas",
    lat: 25.0443,
    lon: -77.3504,
    destaque:
      "Paraíso particular no Caribe — 5 hotéis, 820 quartos, $50mil/dia, 400 reservas e o Filtro MR de 40 páginas na porta.",
    quadro: [
      { cargo: "Hotelaria & concierge", qtd: 1850 },
      { cargo: "Manutenção & jardim", qtd: 540 },
      { cargo: "Gastronomia & chef", qtd: 320 },
      { cargo: "Marina & transporte", qtd: 280 },
      { cargo: "Administração", qtd: 160 },
      { cargo: "Segurança & proteção", qtd: 190 },
      { cargo: "Jurídico & visados", qtd: 60 },
    ],
  },
  {
    id: "coin",
    nome: "Space Coin — Tesouro",
    cidade: "Nova York",
    pais: "🇺🇸 EUA",
    lat: 40.7527,
    lon: -73.9772,
    destaque:
      "Tesouro de $330bi auditado daqui — $55 a unidade, market cap de $485bi e a mineração rodando na cláusula 14.8.",
    quadro: [
      { cargo: "Segurança & custody", qtd: 30 },
      { cargo: "Auditoria & tesouro", qtd: 24 },
      { cargo: "Engenharia de blockchain", qtd: 18 },
      { cargo: "Compliance & jurídico", qtd: 12 },
    ],
  },
  {
    id: "universidade",
    nome: "Space University",
    cidade: "Califórnia",
    pais: "🇺🇸 EUA",
    lat: 36.7783,
    lon: -119.4179,
    imagem: "/sedes/universidade.jpg",
    destaque:
      "Campus californiano da elite — 680 alunos, metade com bolsa integral do Brasil, e a reitora que virou ministra da Educação.",
    quadro: [
      { cargo: "Professores & mentores", qtd: 240 },
      { cargo: "Pesquisa & laboratórios", qtd: 130 },
      { cargo: "Admin & suporte CLT", qtd: 90 },
      { cargo: "Coordenação de alunos", qtd: 40 },
    ],
  },
  {
    id: "basic",
    nome: "Space Basic — Renascer",
    cidade: "Brasília",
    pais: "🇧🇷 Brasil",
    lat: -15.7975,
    lon: -47.8919,
    destaque:
      "Central do programa habitacional — casa de $10, 12 obras simultâneas e a fábrica de escrituras rodando 24h.",
    quadro: [
      { cargo: "Engenharia de obra CLT", qtd: 420 },
      { cargo: "Coordenação de mutirão", qtd: 60 },
      { cargo: "Assistência social", qtd: 45 },
      { cargo: "Jurídico & cartórios", qtd: 25 },
    ],
  },
  {
    id: "gov",
    nome: "Space Government — 130º Andar",
    cidade: "Brasília",
    pais: "🇧🇷 Brasil",
    lat: -15.7983,
    lon: -47.8656,
    destaque:
      "Fazenda e Comunicação do Estado no comando — Sofia na contabilidade, o Axiom na voz, a Bancada Space com 27 governadores.",
    quadro: [
      { cargo: "Assessoria & gabinete", qtd: 70 },
      { cargo: "Ancilares & protocolo", qtd: 58 },
      { cargo: "Comunicação & marketing", qtd: 44 },
      { cargo: "Jurídico da Fazenda", qtd: 38 },
    ],
  },
];

export function sedePorId(id: string | null | undefined): Sede | undefined {
  return SEDES.find((s) => s.id === id);
}

export function totalQuadro(s: Sede): number {
  return s.quadro.reduce((acc, q) => acc + q.qtd, 0);
}
