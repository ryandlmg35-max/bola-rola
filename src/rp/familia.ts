/**
 * Família MR — só o que é canônico no roleplat.txt:
 * Noah Dalbert Mendes (filho), Chloé (filha da Isabella), Juíza Beatriz
 * (mãe da Sofia), Isabella (meia-irmã, CEO da Ilha MR), Greenwich, trusts.
 */

export interface Membro {
  id: string;
  nome: string;
  idade: string;
  papel: string;
  relacao: string;
  traco: string;
  nota: string;
}

export interface BemFamilia {
  titulo: string;
  valor: string;
  nota: string;
}

export interface Momento {
  quando: string;
  texto: string;
}

export const MEMBROS: Membro[] = [
  {
    id: "ryan",
    nome: "Ryan Dalbert",
    idade: "19 anos",
    papel: "Chairman do Space Group",
    relacao: "você",
    traco: "compra tudo que se mexer",
    nota: "74% da holding, $37,4bi pessoais e o país na mão. O mundo gira em volta da torre — e você soube disso antes do mundo.",
  },
  {
    id: "sofia",
    nome: "Sofia Mendes",
    idade: "26 anos",
    papel: "Co-CEO & CFO",
    relacao: "esposa",
    traco: "a auditora mais fria do mundo",
    nota: "Ministra honorária da Fazenda, 6,1% do grupo. Exige nota fiscal de cada parafuso e veta o que você gasta sem pensar duas vezes.",
  },
  {
    id: "noah",
    nome: "Noah Dalbert Mendes",
    idade: "4 meses",
    papel: "Herdeiro do império",
    relacao: "filho",
    traco: "O Herdeiro de Ferro",
    nota: "Noah Mendes Trust de $1bi blindado em três jurisdições e três supercars esperando os 18 anos. O nome dele move mercado antes de saber andar.",
  },
  {
    id: "chloe",
    nome: "Chloé Mendes",
    idade: "3 meses",
    papel: "Herdeira da Ilha MR",
    relacao: "sobrinha",
    traco: "a herdeira rebelde do Caribe",
    nota: "Filha da Isabella, nasceu num ateliê em Montmartre. O Axiom jura que o casamento dela com o Noah funde dois impérios — e faz a Juíza Beatriz surtar pela terceira vez.",
  },
  {
    id: "isabella",
    nome: "Isabella Mendes",
    idade: "30 anos",
    papel: "CEO da Ilha MR",
    relacao: "cunhada & meia-irmã da Sofia",
    traco: "a francesa que a família finge não ver",
    nota: "Artista plástica de Montmartre que vende quadro pra bilionário. Contrato de $24M/ano + 2% do faturamento bruto da ilha. A Juíza odeia; a Sofia protege.",
  },
  {
    id: "beatriz",
    nome: "Juíza Beatriz",
    idade: "a matriarca",
    papel: "Sogra & juíza",
    relacao: "sogra",
    traco: "manda até do banco dos réus",
    nota: "Quer o Noah casado com filha de ministro do STF. Descobrir que o neto cresce ao lado da filha da Isabella é o infarto que a família espera todo dia.",
  },
];

export const BENS: BemFamilia[] = [
  {
    titulo: "Noah Mendes Trust",
    valor: "$1bi blindado",
    nota: "Antigo Mendes-Ryan Heritage Fund, renomeado no cartório e blindado em três jurisdições. Três supercars dormem no trust.",
  },
  {
    titulo: "Casa de Greenwich",
    valor: "$60M",
    nota: "Mansão isolada em Connecticut: 20 acres, lago privativo, heliponto no quintal — 15 minutos de voo da torre.",
  },
  {
    titulo: "Ilha MR",
    valor: "$500mi projetados",
    nota: "Isabella comanda, Chloé tem assento no paraíso. 820 quartos, $50mil a diária e um Filtro MR de 40 páginas.",
  },
  {
    titulo: "A aposta do Axiom",
    valor: "Noah × Chloé",
    nota: "O casamento do século já tem plano de negócios: o herdeiro de trilhões e a artista rebelde. A Juíza que se cuide.",
  },
];

export const MOMENTOS: Momento[] = [
  {
    quando: "O berço do herdeiro",
    texto:
      "Noah nasce em Nova York com UTI móvel no andar e helicóptero na laje. André Fonseca registra a certidão na porta do quarto.",
  },
  {
    quando: "O nome certo",
    texto:
      "Cartório corrige para Noah Dalbert Mendes — sem 'Dalberto'. Trust renomeado, imprensa em chamas, o Reddit o batiza de Herdeiro de Ferro.",
  },
  {
    quando: "A frota dos 18",
    texto:
      "Três supercars em nome do herdeiro: Ferrari, Lamborghini verde Mantis e Porsche. Esperando 17 anos e 9 meses numa garagem climatizada.",
  },
  {
    quando: "A verdade sobre a francesa",
    texto:
      "Sofia revela a meia-irmã Isabella, artista em Montmartre. A Juíza nunca aceitou; a Sofia sempre protegeu.",
  },
  {
    quando: "Chloé chega ao Caribe",
    texto:
      "O jato G700 busca Isabella e Chloé em Paris. A Ilha MR ganha CEO, Chloé ganha trunfo de berço, a Juíza perde o sono.",
  },
  {
    quando: "A profecia do Axiom",
    texto:
      '"Noah e Chloé vão dominar o mundo" — o casamento do século já tem cronograma, e o berçário já tem agenda de negócios.',
  },
];
