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
}

export const products: Product[] = [
  {
    slug: 'agua-viva',
    name: 'Água-viva',
    tagline: 'Flutuando entre bolhas e algas.',
    description:
      'Caderno artesanal com capa kraft e ilustração feita à mão, com uma água-viva cercada por elementos botânicos, em uma composição cheia de detalhes.',
    isInspiredByReference: true,
    price: 59.9,
    image: 'images/agua-viva.webp',
    imageAlt: 'Caderno kraft com ilustração de água-viva e bolhas sobre fundo preto, entre ramos de folhas',
    productionDays: 5,
    details: defaultDetails,
    paperOptions: defaultPaperOptions,
  },
  {
    slug: 'girafa',
    name: 'Girafa',
    tagline: 'Uma espiadinha lá de cima.',
    description:
      'Caderno artesanal com capa kraft e ilustração feita à mão, trazendo uma girafa cheia de personalidade.',
    isInspiredByReference: true,
    price: 59.9,
    image: 'images/girafa.webp',
    imageAlt: 'Caderno kraft com ilustração de uma girafa espiando de ponta-cabeça',
    productionDays: 5,
    details: defaultDetails,
    paperOptions: defaultPaperOptions,
  },
  {
    slug: 'farol',
    name: 'Farol',
    tagline: 'Firme no meio da tempestade.',
    description:
      'Caderno artesanal com capa kraft e ilustração feita à mão, com um farol cercado por ondas e rochas, trazendo um toque náutico cheio de detalhes.',
    isInspiredByReference: true,
    price: 59.9,
    image: 'images/farol.webp',
    imageAlt: 'Caderno kraft com ilustração de farol entre ondas agitadas',
    productionDays: 5,
    details: defaultDetails,
    paperOptions: defaultPaperOptions,
  },
  {
    slug: 'tentaculo',
    name: 'Tentáculo',
    tagline: 'Do fundo do mar, direto pra sua mesa.',
    description:
      'Caderno artesanal com capa kraft e ilustração feita à mão, com um tentáculo enrolado em uma âncora entre bolhas e cordas, trazendo um toque náutico misterioso e cheio de detalhes.',
    isInspiredByReference: false,
    price: 59.9,
    image: 'images/tentaculo.webp',
    imageAlt: 'Caderno kraft com ilustração de tentáculo enrolado em uma âncora',
    productionDays: 5,
    details: defaultDetails,
    paperOptions: defaultPaperOptions,
  },
]

export function findProductBySlug(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug)
}
