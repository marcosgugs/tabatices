import type { Product, ProductOption } from '@/types/product'

const defaultPaperOptions: ProductOption[] = [
  {
    label: 'Pautado',
    priceDelta: 0,
    image: 'images/miolo-pautado.webp',
    imageAlt: 'Miolo pautado com linhas horizontais e marcador de cetim preto',
  },
  {
    label: 'Pontilhado',
    priceDelta: 0,
    image: 'images/miolo-pontilhado.webp',
    imageAlt: 'Miolo pontilhado com grade de pontos e marcador de cetim preto',
  },
  {
    label: 'Liso',
    priceDelta: 0,
    image: 'images/miolo-liso.webp',
    imageAlt: 'Miolo liso em branco com marcador de cetim preto',
  },
]

const defaultDetails = [
  'Caderno Cicero Linha Kraft',
  'Tamanho 14 × 21 cm',
  '96 folhas de papel offset 75 g/m²',
  'Capa dura kraft ilustrada à mão',
  'Espiral wire-o duplo anel preto',
  'Marcador de página em cetim',
]

export const baseNotebook = {
  brand: 'Cicero',
  image: 'images/caderno-cicero.webp',
  imageAlt: 'Caderno Cicero Linha Kraft 14 × 21 cm sem ilustração, com capa kraft, espiral preto e cinta da marca',
  measurementsImage: 'images/caderno-cicero-medidas.webp',
  measurementsImageAlt: 'Caderno Cicero Linha Kraft com as medidas: 21 cm de comprimento, 14 cm de largura e 1,5 cm de espessura',
}

export const products: Product[] = [
  {
    slug: 'agua-viva',
    category: 'notebook',
    name: 'Água-viva',
    tagline: 'Flutuando entre bolhas e algas.',
    description:
      'Caderno artesanal com capa kraft e ilustração feita à mão, com uma água-viva cercada por elementos botânicos, em uma composição cheia de detalhes.',
    isInspiredByReference: true,
    price: 59.9,
    image: 'images/agua-viva.webp',
    imageAlt: 'Caderno kraft com ilustração de água-viva e bolhas sobre fundo preto, entre ramos de folhas',
    extraPhotos: [],
    productionDays: 5,
    details: defaultDetails,
    paperOptions: defaultPaperOptions,
  },
  {
    slug: 'girafa',
    category: 'notebook',
    name: 'Girafa',
    tagline: 'Uma espiadinha lá de cima.',
    description:
      'Caderno artesanal com capa kraft e ilustração feita à mão, trazendo uma girafa cheia de personalidade.',
    isInspiredByReference: true,
    price: 59.9,
    image: 'images/girafa.webp',
    imageAlt: 'Caderno kraft com ilustração de uma girafa espiando de ponta-cabeça',
    extraPhotos: [],
    productionDays: 5,
    details: defaultDetails,
    paperOptions: defaultPaperOptions,
  },
  {
    slug: 'farol',
    category: 'notebook',
    name: 'Farol',
    tagline: 'Firme no meio da tempestade.',
    description:
      'Caderno artesanal com capa kraft e ilustração feita à mão, com um farol cercado por ondas e rochas, trazendo um toque náutico cheio de detalhes.',
    isInspiredByReference: true,
    price: 59.9,
    image: 'images/farol.webp',
    imageAlt: 'Caderno kraft com ilustração de farol entre ondas agitadas',
    extraPhotos: [],
    productionDays: 5,
    details: defaultDetails,
    paperOptions: defaultPaperOptions,
  },
  {
    slug: 'tentaculo',
    category: 'notebook',
    name: 'Tentáculo',
    tagline: 'Do fundo do mar, direto pra sua mesa.',
    description:
      'Caderno artesanal com capa kraft e ilustração feita à mão, com um tentáculo enrolado em uma âncora entre bolhas e cordas, trazendo um toque náutico misterioso e cheio de detalhes.',
    isInspiredByReference: false,
    price: 59.9,
    image: 'images/tentaculo.webp',
    imageAlt: 'Caderno kraft com ilustração de tentáculo enrolado em uma âncora',
    extraPhotos: [],
    productionDays: 5,
    details: defaultDetails,
    paperOptions: defaultPaperOptions,
  },
  {
    slug: 'arvore-de-tsurus',
    category: 'decor',
    name: 'Árvore de Tsurus',
    tagline: 'Desejos de papel pousados nos galhos.',
    description:
      'Árvore decorativa feita à mão, com dezenas de tsurus de origami coloridos pousados nos galhos e voando ao redor, vasinho pintado e musgo, tudo protegido por uma redoma transparente. Na cultura japonesa, o tsuru é símbolo de sorte, saúde e longevidade.',
    isInspiredByReference: false,
    price: null,
    image: 'images/arvore-de-tsurus.webp',
    imageAlt: 'Árvore de galhos verdes com tsurus de origami coloridos, vasinho pintado e musgo dentro de uma redoma transparente',
    extraPhotos: [
      {
        label: 'Galhos',
        image: 'images/arvore-de-tsurus-galhos.webp',
        imageAlt: 'Detalhe dos galhos da árvore com tsurus de origami rosa, laranja, azul e roxo',
      },
      {
        label: 'Outro lado',
        image: 'images/arvore-de-tsurus-verso.webp',
        imageAlt: 'Outro lado da árvore, com tsurus de várias cores pousados nos galhos e pendurados por fios dentro da redoma',
      },
    ],
    productionDays: null,
    details: [
      'Tsurus de origami dobrados à mão',
      'Galhos modelados à mão',
      'Vasinho pintado e base de musgo',
      'Redoma cilíndrica transparente com tampa',
      'Preço sob consulta, combinado pelo WhatsApp',
    ],
    paperOptions: [],
  },
]

export function findProductBySlug(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug)
}
